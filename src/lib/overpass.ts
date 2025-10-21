import { PrismaClient } from '@prisma/client';
import PQueue from 'p-queue';
import crypto from 'crypto';

const prisma = new PrismaClient();
const queue = new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 });

const OVERPASS_ENDPOINT = process.env.OVERPASS_ENDPOINT || 'https://overpass-api.de/api/interpreter';
const CACHE_TTL_HOURS = 24;

function hashQuery(query: string): string {
  return crypto.createHash('md5').update(query).digest('hex');
}

async function getCachedResponse(queryHash: string): Promise<any | null> {
  const cached = await prisma.overpassCache.findUnique({
    where: { queryHash },
  });

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return JSON.parse(cached.response);
  }

  return null;
}

async function setCachedResponse(queryHash: string, query: string, response: any): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

  await prisma.overpassCache.upsert({
    where: { queryHash },
    create: {
      queryHash,
      query,
      response: JSON.stringify(response),
      expiresAt,
    },
    update: {
      response: JSON.stringify(response),
      expiresAt,
    },
  });
}

export async function queryOverpass(query: string): Promise<any> {
  const queryHash = hashQuery(query);

  // Check cache
  const cached = await getCachedResponse(queryHash);
  if (cached) {
    return cached;
  }

  // Execute with rate limiting
  return queue.add(async () => {
    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache response
      await setCachedResponse(queryHash, query, data);

      return data;
    } catch (error) {
      console.error('Overpass query failed:', error);
      throw error;
    }
  });
}

export function buildBuildingFootprintQuery(lat: number, lng: number, radius: number = 50): string {
  return `[out:json][timeout:25];
(
  way(around:${radius},${lat},${lng})["building"];
  relation(around:${radius},${lat},${lng})["building"];
);
out body;
>;
out skel qt;`;
}

export function buildBuildingTagsQuery(lat: number, lng: number, radius: number = 50): string {
  return `[out:json][timeout:25];
way(around:${radius},${lat},${lng})["building"];
out tags;`;
}

export function buildWaterwayQuery(lat: number, lng: number, radius: number = 1000): string {
  return `[out:json][timeout:25];
(
  way(around:${radius},${lat},${lng})["waterway"];
  relation(around:${radius},${lat},${lng})["water"];
  way(around:${radius},${lat},${lng})["natural"="water"];
);
out center;`;
}
