'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { MapView } from './MapView';
import { BreakdownCard } from './BreakdownCard';
import { SourceBadge } from './SourceBadge';
import { PrefillResponse } from '@/lib/types';

export function CompanyForm() {
  const [piva, setPiva] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PrefillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePrefill = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ piva: piva.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante la precompilazione');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input P.IVA */}
      <Card>
        <CardHeader>
          <CardTitle>Precompilazione Polizza Catnat</CardTitle>
          <CardDescription>
            Inserisci la Partita IVA per precompilare i dati della polizza
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="piva">Partita IVA</Label>
              <Input
                id="piva"
                placeholder="01234567890"
                value={piva}
                onChange={(e) => setPiva(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handlePrefill} disabled={loading || !piva}>
                {loading ? 'Caricamento...' : 'Precompila'}
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dati Azienda */}
      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Dati Impresa</CardTitle>
              {data.company.sources?.base && (
                <SourceBadge sourceInfo={data.company.sources.base} />
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ragione Sociale</Label>
                  <p className="font-medium">{data.company.ragioneSociale}</p>
                </div>
                <div>
                  <Label>P.IVA</Label>
                  <p className="font-medium">{data.company.piva}</p>
                </div>
                <div>
                  <Label>ATECO</Label>
                  <p className="font-medium">{data.company.ateco}</p>
                </div>
                <div>
                  <Label>Indirizzo</Label>
                  <p className="font-medium">{data.company.indirizzo}</p>
                </div>
                {data.company.fatturatoStimato && (
                  <div>
                    <Label className="flex items-center gap-2">
                      Fatturato Stimato
                      {data.company.sources?.fatturato && (
                        <SourceBadge sourceInfo={data.company.sources.fatturato} />
                      )}
                    </Label>
                    <p className="font-medium">
                      {new Intl.NumberFormat('it-IT', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                      }).format(data.company.fatturatoStimato)}
                    </p>
                  </div>
                )}
                {data.company.dipendentiStimati && (
                  <div>
                    <Label className="flex items-center gap-2">
                      Dipendenti Stimati
                      {data.company.sources?.dipendenti && (
                        <SourceBadge sourceInfo={data.company.sources.dipendenti} />
                      )}
                    </Label>
                    <p className="font-medium">{data.company.dipendentiStimati}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mappa */}
          <MapView
            lat={data.geo.lat}
            lng={data.geo.lng}
            polygonGeoJSON={data.building.polygonGeoJSON}
          />

          {/* Street View (opzionale) */}
          {data.geo.streetViewUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Street View</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={data.geo.streetViewUrl}
                  alt="Street View"
                  className="w-full rounded-md border"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Google Street View (runtime preview only)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dati Ubicazione */}
          <Card>
            <CardHeader>
              <CardTitle>Caratteristiche Ubicazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    Superficie
                    {data.building.sources.area && (
                      <SourceBadge sourceInfo={data.building.sources.area} />
                    )}
                  </Label>
                  <p className="font-medium">{data.building.areaM2?.toFixed(0)} m²</p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    Numero Piani
                    {data.building.sources.floors && (
                      <SourceBadge sourceInfo={data.building.sources.floors} />
                    )}
                  </Label>
                  <p className="font-medium">{data.building.floors}</p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    Seminterrati
                    {data.building.sources.basement && (
                      <SourceBadge sourceInfo={data.building.sources.basement} />
                    )}
                  </Label>
                  <p className="font-medium">{data.building.hasBasement ? 'Sì' : 'No'}</p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    Materiale
                    {data.building.sources.material && (
                      <SourceBadge sourceInfo={data.building.sources.material} />
                    )}
                  </Label>
                  <p className="font-medium">{data.building.materialCategory}</p>
                </div>
                {data.geo.elevationM && (
                  <div>
                    <Label>Quota (m s.l.m.)</Label>
                    <p className="font-medium">{data.geo.elevationM.toFixed(1)} m</p>
                  </div>
                )}
                {data.risk.distanceToWaterM && (
                  <div>
                    <Label>Distanza da corsi d'acqua</Label>
                    <p className="font-medium">{data.risk.distanceToWaterM.toFixed(0)} m</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Massimali */}
          <BreakdownCard
            breakdown={data.suggestion.breakdown}
            confidence={data.suggestion.confidence}
            sourceInfo={data.suggestion.sources.calculation}
            floodScore={data.risk.floodScore}
          />

          {/* Note Rischio */}
          <Card>
            <CardHeader>
              <CardTitle>Note sul Rischio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{data.risk.notes}</p>
            </CardContent>
          </Card>

          {/* Footer attributions */}
          <div className="text-xs text-muted-foreground text-center py-4 border-t">
            <p>
              Map data © <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap</a> contributors (ODbL)
            </p>
            <p className="mt-1">
              Building data from OpenStreetMap via Overpass API
            </p>
          </div>
        </>
      )}
    </div>
  );
}
