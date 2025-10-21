import { IGoogleAdapter } from '@/lib/types';

export class GoogleAdapter implements IGoogleAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getElevation(lat: number, lng: number): Promise<{ elevationM: number } | null> {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/elevation/json');
      url.searchParams.set('locations', `${lat},${lng}`);
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null;
      }

      return {
        elevationM: data.results[0].elevation,
      };
    } catch (error) {
      console.error('Google Elevation API error:', error);
      return null;
    }
  }

  async getStreetViewUrl(lat: number, lng: number): Promise<{ imgUrl: string } | null> {
    // Street View Static API URL (runtime only, not saved)
    // This generates a URL that can be used in <img> tags but should not be stored permanently
    const url = new URL('https://maps.googleapis.com/maps/api/streetview');
    url.searchParams.set('size', '600x300');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('fov', '90');
    url.searchParams.set('pitch', '0');

    return {
      imgUrl: url.toString(),
    };
  }
}

export function getGoogleAdapter(): IGoogleAdapter | null {
  const useGoogle = process.env.USE_GOOGLE === 'true';

  if (!useGoogle) {
    return null;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('USE_GOOGLE=true but GOOGLE_MAPS_API_KEY not set.');
    return null;
  }

  return new GoogleAdapter(apiKey);
}
