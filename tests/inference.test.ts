import { describe, it, expect } from 'vitest';
import { inferFloors, inferUnderground, inferMaterial, estimateArea } from '../src/inference/ubicazione';
import { estimateAssets } from '../src/inference/massimali';
import { BuildingTags } from '../src/lib/types';

describe('Inference - Ubicazione', () => {
  describe('inferFloors', () => {
    it('should return HIGH confidence when building:levels tag is present', () => {
      const tags: BuildingTags = {
        building: 'yes',
        'building:levels': '5',
      };

      const result = inferFloors(tags);

      expect(result.floors).toBe(5);
      expect(result.confidence).toBe('HIGH');
    });

    it('should return LOW confidence for industrial buildings without levels tag', () => {
      const tags: BuildingTags = {
        building: 'industrial',
      };

      const result = inferFloors(tags);

      expect(result.floors).toBe(1);
      expect(result.confidence).toBe('LOW');
    });

    it('should return LOW confidence for office buildings without levels tag', () => {
      const tags: BuildingTags = {
        building: 'office',
      };

      const result = inferFloors(tags);

      expect(result.floors).toBe(4);
      expect(result.confidence).toBe('LOW');
    });
  });

  describe('inferUnderground', () => {
    it('should return HIGH confidence when underground tag is present', () => {
      const tags: BuildingTags = {
        building: 'yes',
        'building:levels:underground': '2',
      };

      const result = inferUnderground(tags);

      expect(result.hasBasement).toBe(true);
      expect(result.confidence).toBe('HIGH');
    });

    it('should return MEDIUM confidence when no underground tag', () => {
      const tags: BuildingTags = {
        building: 'yes',
      };

      const result = inferUnderground(tags, 100, 5, 500);

      expect(result.confidence).toBe('MEDIUM');
    });
  });

  describe('inferMaterial', () => {
    it('should return HIGH confidence for metal material', () => {
      const tags: BuildingTags = {
        building: 'yes',
        'building:material': 'metal',
      };

      const result = inferMaterial(tags);

      expect(result.materialCategory).toBe('METAL');
      expect(result.confidence).toBe('HIGH');
    });

    it('should return HIGH confidence for brick material', () => {
      const tags: BuildingTags = {
        building: 'yes',
        'building:material': 'brick',
      };

      const result = inferMaterial(tags);

      expect(result.materialCategory).toBe('CLS_LATERIZIO');
      expect(result.confidence).toBe('HIGH');
    });

    it('should return LOW confidence when inferring from building type', () => {
      const tags: BuildingTags = {
        building: 'industrial',
      };

      const result = inferMaterial(tags);

      expect(result.materialCategory).toBe('METAL');
      expect(result.confidence).toBe('LOW');
    });
  });

  describe('estimateArea', () => {
    it('should return HIGH confidence when area is provided', () => {
      const result = estimateArea(1500);

      expect(result.areaM2).toBe(1500);
      expect(result.confidence).toBe('HIGH');
    });

    it('should return LOW confidence for industrial default', () => {
      const result = estimateArea(undefined, 'industrial');

      expect(result.areaM2).toBe(1200);
      expect(result.confidence).toBe('LOW');
    });

    it('should return LOW confidence for retail default', () => {
      const result = estimateArea(undefined, 'retail');

      expect(result.areaM2).toBe(180);
      expect(result.confidence).toBe('LOW');
    });
  });
});

describe('Inference - Massimali', () => {
  it('should calculate assets for industrial sector', () => {
    const result = estimateAssets({
      ateco: '25.11.00',
      areaM2: 1000,
      floors: 2,
      employeesGuess: 30,
      materialCategory: 'METAL',
      floodScore: 0.2,
      areaConfidence: 'HIGH',
      floorsConfidence: 'HIGH',
    });

    expect(result.beniStrumentali).toBeGreaterThan(0);
    expect(result.scorte).toBeGreaterThan(0);
    expect(result.impianti).toBeGreaterThan(0);
    expect(result.massimale).toBeGreaterThan(0);
    expect(result.breakdown.uplift).toBeGreaterThan(1);
  });

  it('should calculate assets for office sector', () => {
    const result = estimateAssets({
      ateco: '62.02.00',
      areaM2: 350,
      floors: 3,
      employeesGuess: 10,
      materialCategory: 'CLS_LATERIZIO',
      floodScore: 0.1,
      areaConfidence: 'HIGH',
      floorsConfidence: 'MEDIUM',
    });

    expect(result.beniStrumentali).toBeGreaterThan(0);
    expect(result.scorte).toBe(0); // Office should have no scorte
    expect(result.impianti).toBeGreaterThan(0);
    expect(result.confidence).toBeDefined();
  });

  it('should apply flood risk uplift correctly', () => {
    const lowRisk = estimateAssets({
      ateco: '47.71.10',
      areaM2: 200,
      floors: 1,
      materialCategory: 'CLS_LATERIZIO',
      floodScore: 0.1,
      areaConfidence: 'HIGH',
      floorsConfidence: 'HIGH',
    });

    const highRisk = estimateAssets({
      ateco: '47.71.10',
      areaM2: 200,
      floors: 1,
      materialCategory: 'CLS_LATERIZIO',
      floodScore: 0.8,
      areaConfidence: 'HIGH',
      floorsConfidence: 'HIGH',
    });

    expect(highRisk.massimale).toBeGreaterThan(lowRisk.massimale);
    expect(highRisk.breakdown.uplift).toBeGreaterThan(lowRisk.breakdown.uplift);
  });
});
