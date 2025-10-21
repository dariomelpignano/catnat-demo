import { Confidence, SourceInfo } from './types';

export function createSourceInfo(
  source: string,
  method: string,
  confidence: Confidence,
  notes?: string
): SourceInfo {
  return {
    source,
    method,
    confidence,
    timestamp: new Date().toISOString(),
    notes,
  };
}

export function getConfidenceLabel(confidence: Confidence): string {
  const labels: Record<Confidence, string> = {
    HIGH: 'Alta affidabilità',
    MEDIUM: 'Affidabilità media',
    LOW: 'Stima indicativa',
  };
  return labels[confidence];
}

export function getConfidenceColor(confidence: Confidence): string {
  const colors: Record<Confidence, string> = {
    HIGH: 'green',
    MEDIUM: 'yellow',
    LOW: 'orange',
  };
  return colors[confidence];
}

export function combineConfidence(...confidences: Confidence[]): Confidence {
  if (confidences.some(c => c === 'LOW')) return 'LOW';
  if (confidences.some(c => c === 'MEDIUM')) return 'MEDIUM';
  return 'HIGH';
}
