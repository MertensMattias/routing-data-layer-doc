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
import type { KeyTypeImpact } from '@/api/types';
import { getKeyImpact } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface KeyImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentTypeName: string;
  keyName: string;
  onDeleteConfirm: (keyName: string) => Promise<void>;
}

export function KeyImpactDialog({
  open,
  onOpenChange,
  segmentTypeName,
  keyName,
  onDeleteConfirm,
}: KeyImpactDialogProps) {
  const [impact, setImpact] = useState<KeyTypeImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadImpact = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getKeyImpact(segmentTypeName, keyName);
      setImpact(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load impact analysis');
    } finally {
      setLoading(false);
    }
  }, [segmentTypeName, keyName]);

  useEffect(() => {
    if (open) {
      loadImpact();
    }
  }, [open, segmentTypeName, keyName, loadImpact]);

  const handleDelete = async () => {
    if (!impact) return;

    try {
      setIsDeleting(true);
      await onDeleteConfirm(keyName);  // Use prop, not impact.typeName
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete key');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Key Impact Analysis</DialogTitle>
          <DialogDescription>
            Review what would be affected if this key is deleted.
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
        ) : impact ? (
          <div className="space-y-4">
            {/* Key Info */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-lg">{impact.displayName || keyName}</h3>
              <p className="text-sm text-muted-foreground font-mono">{keyName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Segment Type: {impact.segmentTypeName}
              </p>
            </div>

            {/* Usage Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Usage Summary</h4>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage Count</span>
                  <span className="font-medium">{impact.usageCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Required Key</span>
                  <span className="font-medium">{impact.isRequired ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Blocking Issues */}
            {impact.hasBlockingIssues && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Cannot Delete</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {impact.blockingReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Safe to Delete */}
            {!impact.hasBlockingIssues && impact.usageCount === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Safe to Delete</div>
                  <p className="text-sm mt-1">
                    This key is not being used and can be safely deleted.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendation */}
            {impact.recommendation && (
              <div className="rounded-lg bg-muted p-3">
                <h4 className="text-sm font-medium mb-1">Recommendation</h4>
                <p className="text-sm text-muted-foreground">{impact.recommendation}</p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Close
          </Button>
          {impact && !impact.hasBlockingIssues && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Key
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

