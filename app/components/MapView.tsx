'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MapViewProps {
  lat: number;
  lng: number;
  polygonGeoJSON?: GeoJSON.Feature;
}

export function MapView({ lat, lng, polygonGeoJSON }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lazy load MapLibre GL to avoid SSR issues
    const loadMap = async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      if (!mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
            },
          ],
        },
        center: [lng, lat],
        zoom: 17,
      });

      // Add marker
      new maplibregl.Marker({ color: '#FF0000' }).setLngLat([lng, lat]).addTo(map);

      // Add polygon if available
      if (polygonGeoJSON) {
        map.on('load', () => {
          map.addSource('building', {
            type: 'geojson',
            data: polygonGeoJSON,
          });

          map.addLayer({
            id: 'building-fill',
            type: 'fill',
            source: 'building',
            paint: {
              'fill-color': '#0080ff',
              'fill-opacity': 0.4,
            },
          });

          map.addLayer({
            id: 'building-outline',
            type: 'line',
            source: 'building',
            paint: {
              'line-color': '#0080ff',
              'line-width': 2,
            },
          });
        });
      }

      return () => map.remove();
    };

    loadMap();
  }, [lat, lng, polygonGeoJSON]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mappa ubicazione</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapContainerRef}
          className="w-full h-96 rounded-md border"
          style={{ minHeight: '400px' }}
        />
        <p className="text-xs text-muted-foreground mt-2">
          © OpenStreetMap contributors
        </p>
      </CardContent>
    </Card>
  );
}
