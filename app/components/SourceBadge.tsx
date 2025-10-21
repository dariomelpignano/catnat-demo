'use client';

import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { SourceInfo } from '@/lib/types';
import { getConfidenceColor } from '@/lib/confidence';

interface SourceBadgeProps {
  sourceInfo: SourceInfo;
}

export function SourceBadge({ sourceInfo }: SourceBadgeProps) {
  const colorMap: Record<string, 'default' | 'secondary' | 'outline'> = {
    green: 'default',
    yellow: 'secondary',
    orange: 'outline',
  };

  const color = getConfidenceColor(sourceInfo.confidence);
  const variant = colorMap[color] || 'outline';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="ml-2 cursor-help">
            {sourceInfo.source}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">Fonte: {sourceInfo.source}</p>
            <p className="text-xs">Metodo: {sourceInfo.method}</p>
            <p className="text-xs">Affidabilità: {sourceInfo.confidence}</p>
            {sourceInfo.notes && <p className="text-xs italic">{sourceInfo.notes}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
