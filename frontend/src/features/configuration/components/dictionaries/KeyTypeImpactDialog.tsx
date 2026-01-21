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
import { AlertTriangle, AlertCircle, CheckCircle, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import type { KeyTypeUsage } from '@/api/types';
import { getKeyTypeUsage } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface KeyTypeImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeName: string;
  onDeleteConfirm: (typeName: string) => Promise<void>;
}

export function KeyTypeImpactDialog({
  open,
  onOpenChange,
  typeName,
  onDeleteConfirm,
}: KeyTypeImpactDialogProps) {
  const [usage, setUsage] = useState<KeyTypeUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getKeyTypeUsage(typeName);
      setUsage(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load usage analysis');
    } finally {
      setLoading(false);
    }
  }, [typeName]);

  useEffect(() => {
    if (open) {
      loadUsage();
    }
  }, [open, typeName, loadUsage]);

  const handleDelete = async () => {
    if (!usage) return;

    try {
      setIsDeleting(true);
      await onDeleteConfirm(usage.typeName);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete key type');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Key Type Impact Analysis
          </DialogTitle>
          <DialogDescription>
            Review what would be affected if this key type is deleted.
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
              <h3 className="font-semibold text-lg">{usage.displayName || usage.typeName}</h3>
              <p className="text-sm text-muted-foreground font-mono">{usage.typeName}</p>
            </div>

            {/* Usage Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Usage Summary</h4>
              <div className="rounded-lg border p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Keys Using This Type</span>
                  <span className="font-medium">{usage.usageCount}</span>
                </div>
              </div>
            </div>

            {/* Safe to Delete */}
            {usage.usageCount === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Safe to Delete</div>
                  <p className="text-sm mt-1">
                    This key type is not being used and can be safely deleted.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Cannot Delete</div>
                  <p className="text-sm">
                    This key type is used by {usage.usageCount} key(s). You must remove or change
                    the type of all keys before deleting this key type.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Close
          </Button>
          {usage && usage.usageCount === 0 && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Key Type
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

