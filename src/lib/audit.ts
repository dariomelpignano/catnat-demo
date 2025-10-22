import { getPrismaClient } from '@/lib/prisma';
import { SourceInfo } from './types';

export async function logAudit(
  piva: string,
  field: string,
  value: any,
  sourceInfo: SourceInfo,
  requestId?: string
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) return; // Skip audit if no DATABASE_URL

  await prisma.auditLog.create({
    data: {
      piva,
      field,
      value: JSON.stringify(value),
      source: sourceInfo.source,
      method: sourceInfo.method,
      confidence: sourceInfo.confidence,
      timestamp: new Date(sourceInfo.timestamp),
      requestId,
    },
  });
}

export async function logMultipleAudits(
  piva: string,
  fields: Record<string, { value: any; sourceInfo: SourceInfo }>,
  requestId?: string
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) return; // Skip audit if no DATABASE_URL

  const entries = Object.entries(fields).map(([field, data]) => ({
    piva,
    field,
    value: JSON.stringify(data.value),
    source: data.sourceInfo.source,
    method: data.sourceInfo.method,
    confidence: data.sourceInfo.confidence,
    timestamp: new Date(data.sourceInfo.timestamp),
    requestId,
  }));

  await prisma.auditLog.createMany({
    data: entries,
  });
}

export async function getAuditTrail(piva: string) {
  const prisma = getPrismaClient();
  if (!prisma) return []; // Return empty array if no DATABASE_URL

  return await prisma.auditLog.findMany({
    where: { piva },
    orderBy: { timestamp: 'desc' },
  });
}
