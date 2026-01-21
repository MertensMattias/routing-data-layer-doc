import { useEffect, useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Box, Loader2, Workflow } from 'lucide-react';
import { getRoutingEntryImpact, type RoutingEntryImpact } from '@/services/routing';
import { getApiErrorMessage } from '@/api/client';

interface RoutingEntryImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routingTableId: string;
  sourceId: string;
  routingId: string;
  onDeleteConfirm?: (id: string) => void;
}

export function RoutingEntryImpactDialog({
  open,
  onOpenChange,
  routingTableId,
  sourceId,
  routingId,
  onDeleteConfirm,
}: RoutingEntryImpactDialogProps) {
  const [impact, setImpact] = useState<RoutingEntryImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadImpact = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRoutingEntryImpact(routingTableId);
      setImpact(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load impact analysis');
    } finally {
      setLoading(false);
    }
  }, [routingTableId]);

  useEffect(() => {
    if (open && routingTableId) {
      loadImpact();
    }
  }, [open, routingTableId, loadImpact]);

  const handleDelete = async () => {
    if (!onDeleteConfirm || !impact) return;

    setDeleting(true);
    try {
      await onDeleteConfirm(impact.routingTableId);
      onOpenChange(false);
    } catch {
      // Error handling done in parent
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!impact) return null;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold">{routingId}</h3>
              <p className="text-sm text-muted-foreground">Source ID: {sourceId}</p>
            </div>
            <Badge variant={impact.hasBlockingIssues ? 'destructive' : 'default'}>
              {impact.hasBlockingIssues ? 'Blocked' : 'Safe'}
            </Badge>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Usage Statistics</h4>

          <div className="space-y-2">
            {/* Segments */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                  <Box className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Active Segments</p>
                  <p className="text-sm text-muted-foreground">
                    Segments referencing this routingId
                  </p>
                </div>
              </div>
              <Badge variant={impact.segmentCount > 0 ? 'secondary' : 'outline'}>
                {impact.segmentCount}
              </Badge>
            </div>

            {/* Other Routing Entries */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
                  <Workflow className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Other Routing Entries</p>
                  <p className="text-sm text-muted-foreground">
                    Other entries with the same routingId
                  </p>
                </div>
              </div>
              <Badge variant={impact.otherRoutingEntriesCount > 0 ? 'secondary' : 'outline'}>
                {impact.otherRoutingEntriesCount}
              </Badge>
            </div>

            {/* Version History */}
            {impact.versionHistoryCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                    <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium">Version History</p>
                    <p className="text-sm text-muted-foreground">
                      Version snapshots for this routingId
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{impact.versionHistoryCount}</Badge>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Total Usage</span>
            <Badge variant={impact.totalUsage > 0 ? 'default' : 'outline'}>
              {impact.totalUsage} reference{impact.totalUsage !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Blocking Issues */}
        {impact.hasBlockingIssues && impact.blockingReasons.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Cannot Delete - Blocking Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {impact.blockingReasons.map((reason, index) => (
                  <li key={index} className="text-sm">
                    {reason}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendation */}
        {impact.recommendation && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">Recommendation:</p>
              <p className="text-sm mt-1">{impact.recommendation}</p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Impact Analysis</DialogTitle>
          <DialogDescription>
            Review what would be affected if this routing entry were deleted.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {onDeleteConfirm ? 'Cancel' : 'Close'}
          </Button>
          {onDeleteConfirm && impact && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={impact.hasBlockingIssues || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Routing Entry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
