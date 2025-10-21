import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdapter } from '@/adapters/google';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const type = searchParams.get('type'); // 'elevation' | 'streetview'

  if (!latStr || !lngStr || !type) {
    return NextResponse.json(
      { error: 'Query parameters "lat", "lng", and "type" are required' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid lat/lng values' }, { status: 400 });
  }

  const adapter = getGoogleAdapter();

  if (!adapter) {
    return NextResponse.json(
      { error: 'Google services not enabled. Set USE_GOOGLE=true and provide GOOGLE_MAPS_API_KEY.' },
      { status: 503 }
    );
  }

  try {
    if (type === 'elevation') {
      const result = await adapter.getElevation(lat, lng);
      if (!result) {
        return NextResponse.json({ error: 'Elevation data not available' }, { status: 404 });
      }
      return NextResponse.json(result);
    } else if (type === 'streetview') {
      const result = await adapter.getStreetViewUrl(lat, lng);
      if (!result) {
        return NextResponse.json({ error: 'Street View not available' }, { status: 404 });
      }
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "elevation" or "streetview"' }, { status: 400 });
    }
  } catch (error) {
    console.error('Google API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
