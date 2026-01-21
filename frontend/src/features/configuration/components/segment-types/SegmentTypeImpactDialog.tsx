import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SegmentTypeUsage } from '@/api/types';
import { getSegmentTypeUsage } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface SegmentTypeImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentTypeName: string;
  onDeleteConfirm: (name: string) => Promise<void>;
}

export function SegmentTypeImpactDialog({
  open,
  onOpenChange,
  segmentTypeName,
  onDeleteConfirm,
}: SegmentTypeImpactDialogProps) {
  const [usage, setUsage] = useState<SegmentTypeUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSegmentTypeUsage(segmentTypeName);
      setUsage(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load usage analysis');
    } finally {
      setLoading(false);
    }
  }, [segmentTypeName]);

  useEffect(() => {
    if (open) {
      loadUsage();
    }
  }, [open, segmentTypeName, loadUsage]);

  const handleDelete = async () => {
    if (!usage) return;

    try {
      setIsDeleting(true);
      await onDeleteConfirm(usage.segmentTypeName);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to deactivate segment type');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Segment Type Impact Analysis</DialogTitle>
          <DialogDescription>
            Review what would be affected if this segment type is deactivated.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : usage ? (
          <div className="space-y-4">
            {/* Type Info */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-lg">{usage.displayName || usage.segmentTypeName}</h3>
              <p className="text-sm text-muted-foreground font-mono">{usage.segmentTypeName}</p>
            </div>

            {/* Usage Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Usage Summary</h4>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Segments</span>
                  <span className="font-medium">{usage.segmentCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Segments</span>
                  <span className="font-medium">{usage.activeSegmentCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Configured Keys</span>
                  <span className="font-medium">{usage.keyCount}</span>
                </div>
              </div>
            </div>

            {/* Blocking Issues */}
            {usage.hasBlockingIssues && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Cannot Deactivate</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {(usage.blockingReasons ?? []).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Safe to Delete */}
            {!usage.hasBlockingIssues && usage.segmentCount === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Safe to Deactivate</div>
                  <p className="text-sm mt-1">
                    This segment type is not being used and can be safely deactivated.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendation */}
            {usage.recommendation && (
              <div className="rounded-lg bg-muted p-3">
                <h4 className="text-sm font-medium mb-1">Recommendation</h4>
                <p className="text-sm text-muted-foreground">{usage.recommendation}</p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Close
          </Button>
          {usage && !usage.hasBlockingIssues && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate Type
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

