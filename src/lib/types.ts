export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SourceInfo {
  source: string;
  method: string;
  timestamp: string;
  confidence: Confidence;
  notes?: string;
}

export interface CompanyData {
  piva: string;
  ragioneSociale: string;
  indirizzo: string;
  cap: string;
  comune: string;
  ateco: string;
  fatturatoStimato?: number;
  dipendentiStimati?: number;
  sources?: Record<string, SourceInfo>;
}

export interface GeoData {
  lat: number;
  lng: number;
  addressNormalized: string;
  elevationM?: number;
  streetViewUrl?: string;
  provider: string;
}

export interface BuildingTags {
  building?: string;
  'building:levels'?: string;
  'building:levels:underground'?: string;
  'building:material'?: string;
  'roof:material'?: string;
  'roof:shape'?: string;
  height?: string;
  [key: string]: string | undefined;
}

export interface BuildingData {
  areaM2?: number;
  floors: number;
  hasBasement: boolean;
  materialCategory: MaterialCategory;
  tags: BuildingTags;
  polygonGeoJSON?: GeoJSON.Feature;
  confidence: Confidence;
  sources: Record<string, SourceInfo>;
}

export type MaterialCategory = 'METAL' | 'CLS_LATERIZIO' | 'LEGNO' | 'MISTO' | 'UNKNOWN';

export interface RiskData {
  floodScore: number; // 0..1
  slopeDeg?: number;
  distanceToWaterM?: number;
  notes: string;
}

export interface MassimaliBreakdown {
  beniStrumentali: number;
  scorte: number;
  impianti: number;
  uplift: number;
  massimale: number;
}

export interface SuggestionData {
  beniStrumentali: number;
  scorte: number;
  impianti: number;
  massimale: number;
  breakdown: MassimaliBreakdown;
  confidence: Confidence;
  sources: Record<string, SourceInfo>;
}

export interface PrefillResponse {
  company: CompanyData;
  geo: GeoData;
  building: BuildingData;
  risk: RiskData;
  suggestion: SuggestionData;
  auditId: string;
}

// Adapter interfaces
export interface IBIAdapter {
  getCompanyByPIVA(piva: string): Promise<CompanyData | null>;
}

export interface IGeocodingAdapter {
  geocodeAddress(address: string): Promise<GeoData | null>;
}

export interface OSMBuildingFeatures {
  polygonGeoJSON?: GeoJSON.Feature;
  tags: BuildingTags;
  areaM2?: number;
  levels?: number;
  undergroundLevels?: number;
  material?: string;
  roof?: string;
  height?: number;
}

export interface IOSMAdapter {
  getBuildingFeatures(lat: number, lng: number): Promise<OSMBuildingFeatures | null>;
  estimateDistanceToWater(lat: number, lng: number): Promise<number>;
}

export interface IGoogleAdapter {
  getElevation(lat: number, lng: number): Promise<{ elevationM: number } | null>;
  getStreetViewUrl(lat: number, lng: number): Promise<{ imgUrl: string } | null>;
}
