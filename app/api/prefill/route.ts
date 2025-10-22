import { NextRequest, NextResponse } from 'next/server';
import { getBIAdapter } from '@/adapters/bi';
import { getGeocodingAdapter } from '@/adapters/geocoding';
import { getOSMAdapter } from '@/adapters/osm';
import { getGoogleAdapter } from '@/adapters/google';
import { computeSlopeAndFloodProxy } from '@/risk/terrain';
import { inferFloors, inferUnderground, inferMaterial, estimateArea } from '@/inference/ubicazione';
import { estimateAssets } from '@/inference/massimali';
import { createSourceInfo, combineConfidence } from '@/lib/confidence';
import { PrefillResponse, BuildingData } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { piva: rawPiva } = body;

    if (!rawPiva) {
      return NextResponse.json({ error: 'P.IVA is required' }, { status: 400 });
    }

    // Trim whitespace from P.IVA
    const piva = rawPiva.trim();

    const auditId = randomUUID();

    // 1. Recupera dati azienda
    const biAdapter = getBIAdapter();
    const company = await biAdapter.getCompanyByPIVA(piva);

    if (!company) {
      return NextResponse.json({ error: 'P.IVA not found' }, { status: 404 });
    }

    // 2. Geocodifica indirizzo
    const geocodingAdapter = getGeocodingAdapter();
    const geo = await geocodingAdapter.geocodeAddress(company.indirizzo);

    if (!geo) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
    }

    // 3. Google Elevation & Street View (opzionale)
    const googleAdapter = getGoogleAdapter();
    let elevationM: number | undefined;
    let streetViewUrl: string | undefined;

    if (googleAdapter) {
      const elevationData = await googleAdapter.getElevation(geo.lat, geo.lng);
      if (elevationData) {
        elevationM = elevationData.elevationM;
      }

      const streetViewData = await googleAdapter.getStreetViewUrl(geo.lat, geo.lng);
      if (streetViewData) {
        streetViewUrl = streetViewData.imgUrl;
      }
    }

    geo.elevationM = elevationM;
    geo.streetViewUrl = streetViewUrl;

    // 4. OSM Building features
    const osmAdapter = getOSMAdapter();
    const osmBuilding = await osmAdapter.getBuildingFeatures(geo.lat, geo.lng);

    // 5. Distanza dall'acqua
    const distanceToWaterM = await osmAdapter.estimateDistanceToWater(geo.lat, geo.lng);

    // 6. Inferenza ubicazione
    const tags = osmBuilding?.tags || {};
    const floorsInferred = inferFloors(tags);
    const areaInferred = estimateArea(osmBuilding?.areaM2, tags.building);

    // 7. Calcola rischio
    const risk = computeSlopeAndFloodProxy({
      lat: geo.lat,
      lng: geo.lng,
      elevationM,
      buildingArea: areaInferred.areaM2,
      distanceToWaterM,
    });

    const undergroundInferred = inferUnderground(
      tags,
      elevationM,
      risk.slopeDeg,
      distanceToWaterM
    );
    const materialInferred = inferMaterial(tags);

    const building: BuildingData = {
      areaM2: areaInferred.areaM2,
      floors: floorsInferred.floors,
      hasBasement: undergroundInferred.hasBasement,
      materialCategory: materialInferred.materialCategory,
      tags,
      polygonGeoJSON: osmBuilding?.polygonGeoJSON,
      confidence: combineConfidence(
        floorsInferred.confidence,
        areaInferred.confidence,
        undergroundInferred.confidence,
        materialInferred.confidence
      ),
      sources: {
        floors: createSourceInfo(
          'OSM',
          osmBuilding?.levels ? 'building:levels tag' : 'category estimate',
          floorsInferred.confidence
        ),
        area: createSourceInfo(
          'OSM',
          osmBuilding?.areaM2 ? 'polygon geometry' : 'category default',
          areaInferred.confidence
        ),
        basement: createSourceInfo(
          'OSM',
          osmBuilding?.undergroundLevels ? 'building:levels:underground tag' : 'heuristic',
          undergroundInferred.confidence
        ),
        material: createSourceInfo(
          'OSM',
          tags['building:material'] ? 'building:material tag' : 'roof/type estimate',
          materialInferred.confidence
        ),
      },
    };

    // 8. Stima massimali
    const massimaliOutput = estimateAssets({
      ateco: company.ateco,
      areaM2: building.areaM2!,
      floors: building.floors,
      employeesGuess: company.dipendentiStimati,
      fatturatoGuess: company.fatturatoStimato,
      materialCategory: building.materialCategory,
      floodScore: risk.floodScore,
      areaConfidence: areaInferred.confidence,
      floorsConfidence: floorsInferred.confidence,
    });

    const suggestion = {
      ...massimaliOutput,
      sources: {
        calculation: createSourceInfo(
          'Parametric Model',
          `ATECO ${company.ateco}`,
          massimaliOutput.confidence,
          'Stima basata su regole parametriche per settore'
        ),
      },
    };

    const response: PrefillResponse = {
      company,
      geo,
      building,
      risk,
      suggestion,
      auditId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Prefill error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
