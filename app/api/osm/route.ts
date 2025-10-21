import { NextRequest, NextResponse } from 'next/server';
import { getOSMAdapter } from '@/adapters/osm';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'Query parameters "lat" and "lng" are required' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid lat/lng values' }, { status: 400 });
  }

  try {
    const adapter = getOSMAdapter();
    const result = await adapter.getBuildingFeatures(lat, lng);

    if (!result) {
      return NextResponse.json({ error: 'No building found at the specified location' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('OSM API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
