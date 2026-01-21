import { CheckCircle, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChangeSetBadgeProps {
  changeSetId: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'PENDING';
  publishedAt?: string | Date;
  compact?: boolean;
  showTimestamp?: boolean;
}

/**
 * Badge component to visualize ChangeSet state
 * - PUBLISHED (green): No changeSetId, actively running
 * - DRAFT (yellow): Has changeSetId, awaiting publish
 * - PENDING (blue): In publish queue (optional future state)
 */
export function ChangeSetBadge({ 
  changeSetId, 
  status,
  publishedAt, 
  compact = false,
  showTimestamp = true,
}: ChangeSetBadgeProps) {
  // Derive status from changeSetId if not provided
  const derivedStatus = status || (changeSetId ? 'DRAFT' : 'PUBLISHED');
  
  if (derivedStatus === 'PUBLISHED') {
    return (
      <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
        <CheckCircle className="h-3 w-3" />
        <span>Published</span>
        {!compact && showTimestamp && publishedAt && (
          <span className="text-xs opacity-75 ml-1">
            {new Date(publishedAt).toLocaleDateString()}
          </span>
        )}
      </Badge>
    );
  }

  if (derivedStatus === 'PENDING') {
    return (
      <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
        <span className="animate-pulse">⏳</span>
        <span>Pending</span>
      </Badge>
    );
  }

  // DRAFT
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100">
      <Pencil className="h-3 w-3" />
      <span>Draft</span>
      {!compact && changeSetId && (
        <span className="text-xs opacity-75 ml-1 font-mono">
          {changeSetId.slice(0, 8)}...
        </span>
      )}
    </Badge>
  );
}
