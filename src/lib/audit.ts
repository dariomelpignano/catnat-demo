import { PrismaClient } from '@prisma/client';
import { SourceInfo } from './types';

const prisma = new PrismaClient();

export async function logAudit(
  piva: string,
  field: string,
  value: any,
  sourceInfo: SourceInfo,
  requestId?: string
): Promise<void> {
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
  return await prisma.auditLog.findMany({
    where: { piva },
    orderBy: { timestamp: 'desc' },
  });
}
