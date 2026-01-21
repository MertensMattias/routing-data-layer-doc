import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { SegmentType, SegmentTypeUsage } from '@/api/types';
import { getSegmentTypeUsage } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface UsageTabProps {
  segmentType: SegmentType;
  onClose: () => void;
}

export function UsageTab({ segmentType, onClose }: UsageTabProps) {
  const [usage, setUsage] = useState<SegmentTypeUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSegmentTypeUsage(segmentType.segmentTypeName);
      setUsage(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load usage statistics');
      toast.error('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  }, [segmentType.segmentTypeName]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Usage Statistics</h3>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsage}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Usage Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Segments</div>
          <div className="text-3xl font-bold">{usage.segmentCount ?? 0}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">Active Segments</div>
          <div className="text-3xl font-bold">{usage.activeSegmentCount ?? 0}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">Configured Keys</div>
          <div className="text-3xl font-bold">{usage.keyCount ?? 0}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
          <div className="mt-1">
            <Badge variant={usage.hasBlockingIssues ? 'destructive' : 'default'} className="text-base">
              {usage.hasBlockingIssues ? 'Has Issues' : 'Healthy'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="space-y-4">
        <h4 className="font-medium">Details</h4>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Segment Type Name:</span>
            <span className="font-mono">{usage.segmentTypeName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Display Name:</span>
            <span>{usage.displayName || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Inactive Segments:</span>
            <span>{(usage.segmentCount ?? 0) - (usage.activeSegmentCount ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Blocking Issues */}
      {usage.hasBlockingIssues && (usage.blockingReasons ?? []).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Issues</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {(usage.blockingReasons ?? []).map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendation */}
      {usage.recommendation && (
        <div className="rounded-lg bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">Recommendation</h4>
          <p className="text-sm text-muted-foreground">{usage.recommendation}</p>
        </div>
      )}

      {/* No Usage Message */}
      {(usage.segmentCount ?? 0) === 0 && (
        <Alert>
          <AlertDescription>
            This segment type is not currently being used by any segments.
            You can safely modify or delete it without affecting existing routing flows.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

