'use client';

import { Badge } from './ui/badge';
import { Confidence } from '@/lib/types';
import { getConfidenceColor, getConfidenceLabel } from '@/lib/confidence';

interface ConfidencePillProps {
  confidence: Confidence;
}

export function ConfidencePill({ confidence }: ConfidencePillProps) {
  const color = getConfidenceColor(confidence);
  const label = getConfidenceLabel(confidence);

  const colorClassMap: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  const className = colorClassMap[color] || 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
