import { NextRequest, NextResponse } from 'next/server';
import { getGeocodingAdapter } from '@/adapters/geocoding';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const address = searchParams.get('q');

  if (!address) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const adapter = getGeocodingAdapter();
    const result = await adapter.geocodeAddress(address);

    if (!result) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
