import { BuildingTags, Confidence, MaterialCategory } from '@/lib/types';

/**
 * R1 - Inferenza numero di piani
 * Se building:levels presente → HIGH confidence
 * Altrimenti stima da categoria edificio → LOW confidence
 */
export function inferFloors(tags: BuildingTags): { floors: number; confidence: Confidence } {
  // Check building:levels tag
  if (tags['building:levels']) {
    const levels = parseInt(tags['building:levels'], 10);
    if (!isNaN(levels) && levels > 0) {
      return { floors: levels, confidence: 'HIGH' };
    }
  }

  // Fallback: stima da categoria
  const buildingType = tags.building?.toLowerCase();

  if (buildingType === 'industrial' || buildingType === 'warehouse') {
    return { floors: 1, confidence: 'LOW' };
  } else if (buildingType === 'retail' || buildingType === 'commercial') {
    return { floors: 2, confidence: 'LOW' };
  } else if (buildingType === 'office') {
    return { floors: 4, confidence: 'LOW' };
  } else if (buildingType === 'residential' || buildingType === 'apartments') {
    return { floors: 3, confidence: 'LOW' };
  }

  // Default
  return { floors: 2, confidence: 'LOW' };
}

/**
 * R2 - Inferenza seminterrati
 * Se building:levels:underground >= 1 → true (HIGH)
 * Altrimenti usa proxy: elevazione bassa + pendenza bassa + vicino acqua → true (LOW)
 */
export function inferUnderground(
  tags: BuildingTags,
  elevationM?: number,
  slopeDeg?: number,
  distanceToWaterM?: number
): { hasBasement: boolean; confidence: Confidence } {
  // Check building:levels:underground tag
  if (tags['building:levels:underground']) {
    const underground = parseInt(tags['building:levels:underground'], 10);
    if (!isNaN(underground) && underground >= 1) {
      return { hasBasement: true, confidence: 'HIGH' };
    } else if (!isNaN(underground) && underground === 0) {
      return { hasBasement: false, confidence: 'HIGH' };
    }
  }

  // Fallback: euristica
  const lowElevation = elevationM !== undefined && elevationM < 15;
  const lowSlope = slopeDeg !== undefined && slopeDeg < 2;
  const nearWater = distanceToWaterM !== undefined && distanceToWaterM < 300;

  if (lowElevation && lowSlope && nearWater) {
    // Zona a rischio → probabile nessun seminterrato
    return { hasBasement: false, confidence: 'MEDIUM' };
  }

  // In assenza di informazioni, assumiamo presenza moderata di seminterrati
  // (dipende dal tipo di edificio, ma senza dati sufficienti è MEDIUM)
  return { hasBasement: false, confidence: 'MEDIUM' };
}

/**
 * R3 - Inferenza materiali
 * Mappa building:material in categorie standard
 * Se assente, usa roof:material come indizio (LOW)
 */
export function inferMaterial(tags: BuildingTags): { materialCategory: MaterialCategory; confidence: Confidence } {
  const material = tags['building:material']?.toLowerCase();

  if (material) {
    if (material.includes('metal') || material.includes('steel')) {
      return { materialCategory: 'METAL', confidence: 'HIGH' };
    } else if (material.includes('brick') || material.includes('concrete') || material.includes('stone')) {
      return { materialCategory: 'CLS_LATERIZIO', confidence: 'HIGH' };
    } else if (material.includes('wood') || material.includes('timber')) {
      return { materialCategory: 'LEGNO', confidence: 'HIGH' };
    } else {
      return { materialCategory: 'MISTO', confidence: 'MEDIUM' };
    }
  }

  // Fallback: usa roof:material
  const roof = tags['roof:material']?.toLowerCase();
  if (roof) {
    if (roof.includes('metal') || roof.includes('steel')) {
      return { materialCategory: 'METAL', confidence: 'LOW' };
    } else if (roof.includes('tile') || roof.includes('concrete')) {
      return { materialCategory: 'CLS_LATERIZIO', confidence: 'LOW' };
    } else if (roof.includes('wood')) {
      return { materialCategory: 'LEGNO', confidence: 'LOW' };
    }
  }

  // Fallback: usa tipo edificio
  const buildingType = tags.building?.toLowerCase();
  if (buildingType === 'industrial' || buildingType === 'warehouse') {
    return { materialCategory: 'METAL', confidence: 'LOW' };
  }

  return { materialCategory: 'UNKNOWN', confidence: 'LOW' };
}

/**
 * R4 - Stima superficie
 * Se poligono OSM disponibile → usa area calcolata (HIGH)
 * Altrimenti default per categoria (LOW)
 */
export function estimateArea(
  areaM2?: number,
  buildingType?: string
): { areaM2: number; confidence: Confidence } {
  if (areaM2 && areaM2 > 0) {
    return { areaM2, confidence: 'HIGH' };
  }

  // Default per categoria
  const type = buildingType?.toLowerCase();

  if (type === 'industrial' || type === 'warehouse') {
    return { areaM2: 1200, confidence: 'LOW' };
  } else if (type === 'retail' || type === 'commercial') {
    return { areaM2: 180, confidence: 'LOW' };
  } else if (type === 'office') {
    return { areaM2: 350, confidence: 'LOW' };
  } else if (type === 'residential' || type === 'apartments') {
    return { areaM2: 120, confidence: 'LOW' };
  }

  return { areaM2: 250, confidence: 'LOW' };
}
