import { IOSMAdapter, OSMBuildingFeatures, BuildingTags } from '@/lib/types';
import { queryOverpass, buildBuildingFootprintQuery, buildWaterwayQuery } from '@/lib/overpass';
import { area, polygon, distance, point } from '@/lib/turf';

export class OSMAdapter implements IOSMAdapter {
  async getBuildingFeatures(lat: number, lng: number): Promise<OSMBuildingFeatures | null> {
    try {
      const query = buildBuildingFootprintQuery(lat, lng);
      const data = await queryOverpass(query);

      if (!data.elements || data.elements.length === 0) {
        return null;
      }

      // Find the closest building way
      const ways = data.elements.filter((el: any) => el.type === 'way' && el.tags?.building);

      if (ways.length === 0) {
        return null;
      }

      const building = ways[0];
      const tags: BuildingTags = building.tags || {};

      // Build polygon from nodes
      let polygonGeoJSON: GeoJSON.Feature | undefined;
      let areaM2: number | undefined;

      if (building.nodes && building.nodes.length > 0) {
        const nodes = data.elements.filter((el: any) => el.type === 'node');
        const nodeMap = new Map<number, any>(nodes.map((n: any) => [n.id, n]));

        const coordinates = building.nodes
          .map((nodeId: number) => {
            const node = nodeMap.get(nodeId);
            return node ? [node.lon, node.lat] : null;
          })
          .filter((coord: any) => coord !== null);

        if (coordinates.length >= 3) {
          // Close the polygon if not already closed
          if (
            coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1]
          ) {
            coordinates.push(coordinates[0]);
          }

          polygonGeoJSON = polygon([coordinates]);
          areaM2 = area(polygonGeoJSON);
        }
      }

      // Parse building levels
      const levels = tags['building:levels'] ? parseInt(tags['building:levels'], 10) : undefined;
      const undergroundLevels = tags['building:levels:underground']
        ? parseInt(tags['building:levels:underground'], 10)
        : undefined;

      // Parse height
      const height = tags.height ? parseFloat(tags.height) : undefined;

      return {
        polygonGeoJSON,
        tags,
        areaM2,
        levels,
        undergroundLevels,
        material: tags['building:material'],
        roof: tags['roof:material'] || tags['roof:shape'],
        height,
      };
    } catch (error) {
      console.error('OSM getBuildingFeatures error:', error);
      return null;
    }
  }

  async estimateDistanceToWater(lat: number, lng: number): Promise<number> {
    try {
      const query = buildWaterwayQuery(lat, lng);
      const data = await queryOverpass(query);

      if (!data.elements || data.elements.length === 0) {
        // No water found within 1km
        return 10000;
      }

      const buildingPoint = point([lng, lat]);
      let minDistance = Infinity;

      for (const element of data.elements) {
        let waterLat: number;
        let waterLon: number;

        if (element.type === 'way' && element.center) {
          waterLat = element.center.lat;
          waterLon = element.center.lon;
        } else if (element.type === 'node') {
          waterLat = element.lat;
          waterLon = element.lon;
        } else {
          continue;
        }

        const waterPoint = point([waterLon, waterLat]);
        const dist = distance(buildingPoint, waterPoint, { units: 'meters' });

        if (dist < minDistance) {
          minDistance = dist;
        }
      }

      return minDistance === Infinity ? 10000 : minDistance;
    } catch (error) {
      console.error('OSM estimateDistanceToWater error:', error);
      return 10000;
    }
  }
}

export function getOSMAdapter(): IOSMAdapter {
  return new OSMAdapter();
}
