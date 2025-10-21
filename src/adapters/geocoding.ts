import { IGeocodingAdapter, GeoData } from '@/lib/types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GoogleGeocoderAdapter implements IGeocodingAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocodeAddress(address: string): Promise<GeoData | null> {
    // Check cache first
    const cached = await this.getFromCache(address);
    if (cached) return cached;

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', address);
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('region', 'it');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null;
      }

      const result = data.results[0];
      const location = result.geometry.location;

      const geoData: GeoData = {
        lat: location.lat,
        lng: location.lng,
        addressNormalized: result.formatted_address,
        provider: 'google',
      };

      // Cache result
      await this.saveToCache(address, geoData);

      return geoData;
    } catch (error) {
      console.error('Google Geocoding error:', error);
      return null;
    }
  }

  private async getFromCache(address: string): Promise<GeoData | null> {
    const cached = await prisma.geocodingCache.findUnique({
      where: { address },
    });

    if (cached) {
      return {
        lat: cached.lat,
        lng: cached.lng,
        addressNormalized: cached.normalized,
        provider: cached.provider,
      };
    }

    return null;
  }

  private async saveToCache(address: string, geoData: GeoData): Promise<void> {
    await prisma.geocodingCache.upsert({
      where: { address },
      create: {
        address,
        lat: geoData.lat,
        lng: geoData.lng,
        normalized: geoData.addressNormalized,
        provider: geoData.provider,
      },
      update: {
        lat: geoData.lat,
        lng: geoData.lng,
        normalized: geoData.addressNormalized,
        provider: geoData.provider,
      },
    });
  }
}

export class NominatimGeocoderAdapter implements IGeocodingAdapter {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NOMINATIM_BASE || 'https://nominatim.openstreetmap.org';
  }

  async geocodeAddress(address: string): Promise<GeoData | null> {
    // Check cache first
    const cached = await this.getFromCache(address);
    if (cached) return cached;

    try {
      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.set('q', address);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'it');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'CatnatDemo/1.0',
        },
      });

      const data = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];

      const geoData: GeoData = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        addressNormalized: result.display_name,
        provider: 'nominatim',
      };

      // Cache result
      await this.saveToCache(address, geoData);

      // Respect Nominatim usage policy (max 1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      return geoData;
    } catch (error) {
      console.error('Nominatim Geocoding error:', error);
      return null;
    }
  }

  private async getFromCache(address: string): Promise<GeoData | null> {
    const cached = await prisma.geocodingCache.findUnique({
      where: { address },
    });

    if (cached) {
      return {
        lat: cached.lat,
        lng: cached.lng,
        addressNormalized: cached.normalized,
        provider: cached.provider,
      };
    }

    return null;
  }

  private async saveToCache(address: string, geoData: GeoData): Promise<void> {
    await prisma.geocodingCache.upsert({
      where: { address },
      create: {
        address,
        lat: geoData.lat,
        lng: geoData.lng,
        normalized: geoData.addressNormalized,
        provider: geoData.provider,
      },
      update: {
        lat: geoData.lat,
        lng: geoData.lng,
        normalized: geoData.addressNormalized,
        provider: geoData.provider,
      },
    });
  }
}

export function getGeocodingAdapter(): IGeocodingAdapter {
  const useGoogle = process.env.USE_GOOGLE === 'true';

  if (useGoogle) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('USE_GOOGLE=true but GOOGLE_MAPS_API_KEY not set. Falling back to Nominatim.');
      return new NominatimGeocoderAdapter();
    }
    return new GoogleGeocoderAdapter(apiKey);
  }

  return new NominatimGeocoderAdapter();
}
