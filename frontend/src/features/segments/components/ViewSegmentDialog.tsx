import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getSegment } from '@/services/segments/segments.service';
import type { Segment } from '@/api/types';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { useSegmentTypeKeys } from '@/features/flow-designer/hooks/useSegmentTypeKeys';
import { useMemo } from 'react';
import { TransitionManager } from './segment-form/TransitionManager';

interface ViewSegmentDialogProps {
  segmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewSegmentDialog({
  segmentId,
  open,
  onOpenChange,
}: ViewSegmentDialogProps) {
  const {
    data: segment,
    isLoading,
    error,
  } = useQuery<Segment>({
    queryKey: ['segment', segmentId],
    queryFn: async () => {
      if (!segmentId) throw new Error('Segment ID is required');
      return getSegment(segmentId);
    },
    enabled: open && !!segmentId,
  });

  // Fetch keys for the segment type to map dicKeyId to keyName/displayName
  const { data: keys } = useSegmentTypeKeys(segment?.segmentTypeName || '');

  // Create map from dicKeyId to key name/display name
  const keyNameMap = useMemo(() => {
    if (!keys) return new Map<number, string>();
    const map = new Map<number, string>();
    keys.forEach((key) => {
      map.set(key.dicKeyId, key.displayName || key.keyName);
    });
    return map;
  }, [keys]);

  if (!open || !segmentId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Segment Details</DialogTitle>
          <DialogDescription>View segment configuration and metadata</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading segment</h3>
                <p className="mt-1 text-sm text-red-700">{(error as Error).message}</p>
              </div>
            </div>
          </div>
        )}

        {segment && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Segment ID</div>
                  <div className="font-mono text-sm">{segment.segmentId}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Routing ID</div>
                  <div className="text-sm">{segment.routingId}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Segment Name</div>
                  <div className="text-sm font-medium">{segment.segmentName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Display Name</div>
                  <div className="text-sm">{segment.displayName || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Segment Type</div>
                  <Badge variant="outline">{segment.segmentTypeName || 'Unknown'}</Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Status</div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      segment.isActive
                        ? 'bg-emerald-50/50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {segment.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {segment.changeSetId && (
                  <div>
                    <div className="text-xs text-slate-500">ChangeSet ID</div>
                    <div className="font-mono text-xs">{segment.changeSetId}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Configuration */}
            {segment.configs && segment.configs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Configuration</h3>
                <div className="space-y-2">
                  {segment.configs.map((config: { dicKeyId: number; value?: string }, index: number) => {
                    const keyName = keyNameMap.get(config.dicKeyId) || `Key ID: ${config.dicKeyId}`;
                    return (
                      <div key={index} className="flex justify-between items-start py-2 border-b">
                        <div className="text-sm font-medium">{keyName}</div>
                        <div className="text-sm text-slate-600 font-mono">
                          {config.value || '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hooks */}
            {segment.hooks && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Hooks</h3>
                  <pre className="text-xs bg-slate-50/50 p-3 rounded overflow-x-auto">
                    {segment.hooks}
                  </pre>
                </div>
              </>
            )}

            {/* Transitions */}
            <Separator />
            <TransitionManager
              transitions={(segment.transitions || []).map((t, index) => ({
                resultName: t.resultName,
                nextSegmentName: t.nextSegmentName ?? undefined,
                nextSegmentId: t.nextSegmentId ?? undefined,
                contextKey: undefined,
                params: t.params ? JSON.stringify(t.params) : null,
                transitionOrder: index,
              }))}
              routingId={segment.routingId}
              mode="view"
              compact
            />

            {/* Metadata */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Created</div>
                  <div>{new Date(segment.dateCreated).toLocaleString()}</div>
                </div>
                {segment.createdBy && (
                  <div>
                    <div className="text-xs text-slate-500">Created By</div>
                    <div>{segment.createdBy}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-500">Last Updated</div>
                  <div>{new Date(segment.dateUpdated).toLocaleString()}</div>
                </div>
                {segment.updatedBy && (
                  <div>
                    <div className="text-xs text-slate-500">Updated By</div>
                    <div>{segment.updatedBy}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
