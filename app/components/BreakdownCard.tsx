'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { MassimaliBreakdown } from '@/lib/types';
import { ConfidencePill } from './ConfidencePill';
import { SourceBadge } from './SourceBadge';
import { Confidence, SourceInfo } from '@/lib/types';

interface BreakdownCardProps {
  breakdown: MassimaliBreakdown;
  confidence: Confidence;
  sourceInfo: SourceInfo;
  floodScore: number;
}

export function BreakdownCard({ breakdown, confidence, sourceInfo, floodScore }: BreakdownCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const floodRiskLabel =
    floodScore < 0.3 ? 'Basso' : floodScore < 0.6 ? 'Medio' : 'Alto';
  const floodRiskColor =
    floodScore < 0.3
      ? 'text-green-600'
      : floodScore < 0.6
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Massimali suggeriti</CardTitle>
          <div className="flex items-center gap-2">
            <ConfidencePill confidence={confidence} />
            <SourceBadge sourceInfo={sourceInfo} />
          </div>
        </div>
        <CardDescription>
          Stima basata su parametri di settore (ATECO) e caratteristiche dell'edificio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-muted-foreground">Beni Strumentali</p>
              <p className="text-2xl font-bold">{formatCurrency(breakdown.beniStrumentali)}</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-muted-foreground">Scorte</p>
              <p className="text-2xl font-bold">{formatCurrency(breakdown.scorte)}</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-sm text-muted-foreground">Impianti</p>
              <p className="text-2xl font-bold">{formatCurrency(breakdown.impianti)}</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <p className="text-sm text-muted-foreground">Uplift Rischio</p>
              <p className="text-2xl font-bold">×{breakdown.uplift}</p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Massimale Totale Consigliato</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(breakdown.massimale)}</p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Rischio Allagamento (proxy)</p>
              <p className={`text-sm font-semibold ${floodRiskColor}`}>
                {floodRiskLabel} ({(floodScore * 100).toFixed(0)}%)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
