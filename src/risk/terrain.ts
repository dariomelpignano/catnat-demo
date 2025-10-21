import { RiskData } from '@/lib/types';

interface TerrainInput {
  lat: number;
  lng: number;
  elevationM?: number;
  buildingArea?: number;
  distanceToWaterM?: number;
}

/**
 * Calcola una stima approssimativa della pendenza del terreno.
 * In assenza di un vero DEM (Digital Elevation Model), usa l'elevazione come proxy.
 * Una pendenza bassa combinata con quota bassa indica maggior rischio allagamento.
 */
function estimateSlope(elevationM?: number): number {
  // Fallback: stima euristica basata solo sull'elevazione
  if (!elevationM || elevationM < 0) {
    return 0.5; // default conservative
  }

  // Pendenza molto approssimativa:
  // - Quota < 10m → pendenza bassa (pianura)
  // - Quota 10-50m → pendenza media
  // - Quota > 50m → pendenza alta
  if (elevationM < 10) {
    return 0.5;
  } else if (elevationM < 50) {
    return 2.0;
  } else {
    return 5.0;
  }
}

/**
 * Calcola un punteggio di rischio allagamento proxy (0..1).
 * Formula: floodScore = clamp(w1*(1/distToWater) + w2*(1/elev) + w3*(1/slope), 0, 1)
 *
 * Regola R5:
 * - w1 = 0.5 (peso distanza acqua)
 * - w2 = 0.3 (peso elevazione)
 * - w3 = 0.2 (peso pendenza)
 * - distanza > 1000m → contributo quasi nullo
 */
export function computeSlopeAndFloodProxy(input: TerrainInput): RiskData {
  const { elevationM, distanceToWaterM } = input;

  const slopeDeg = estimateSlope(elevationM);

  // Normalizza i contributi
  const w1 = 0.5;
  const w2 = 0.3;
  const w3 = 0.2;

  let score = 0;

  // Contributo distanza acqua (max a 0m, min oltre 1000m)
  if (distanceToWaterM !== undefined) {
    const distContrib = distanceToWaterM > 1000 ? 0 : 1 / Math.max(distanceToWaterM, 1);
    score += w1 * Math.min(distContrib, 1);
  }

  // Contributo elevazione (max a 1m, min oltre 100m)
  if (elevationM !== undefined) {
    const elevContrib = 1 / Math.max(elevationM, 1);
    score += w2 * Math.min(elevContrib, 1);
  }

  // Contributo pendenza (max a 0.1°, min oltre 10°)
  const slopeContrib = 1 / Math.max(slopeDeg, 0.5);
  score += w3 * Math.min(slopeContrib, 1);

  const floodScore = Math.max(0, Math.min(1, score));

  let notes = 'Rischio allagamento calcolato tramite proxy: ';
  if (floodScore < 0.3) {
    notes += 'BASSO (edificio in zona elevata o distante da corsi d\'acqua)';
  } else if (floodScore < 0.6) {
    notes += 'MEDIO (possibile rischio in caso di eventi eccezionali)';
  } else {
    notes += 'ALTO (edificio in area pianeggiante vicino a corsi d\'acqua)';
  }

  return {
    floodScore,
    slopeDeg,
    distanceToWaterM,
    notes,
  };
}
