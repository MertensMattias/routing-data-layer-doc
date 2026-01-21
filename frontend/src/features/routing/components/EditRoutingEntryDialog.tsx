import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { JsonEditorComponent } from '@/components/ui/json-editor';
import { Loader2 } from 'lucide-react';
import { updateRoutingEntry, type RoutingEntryResponseDto } from '@/services/routing';
import { listMessageStores, type MessageStoreResponseDto } from '@/services/messages/message-stores.service';
import { getApiErrorMessage } from '@/api/client';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';

interface EditRoutingEntryDialogProps {
  routingEntry: RoutingEntryResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRoutingEntryDialog({
  routingEntry,
  open,
  onOpenChange,
  onSuccess,
}: EditRoutingEntryDialogProps) {
  const { selectedCompanyProjectId } = useCompanyProjectContext();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [messageStores, setMessageStores] = useState<MessageStoreResponseDto[]>([]);

  // Form state
  const [sourceId, setSourceId] = useState(routingEntry.sourceId);
  const [initSegment, setInitSegment] = useState(routingEntry.initSegment);
  const [languageCode, setLanguageCode] = useState(routingEntry.languageCode || '');
  const [messageStoreId, setMessageStoreId] = useState<number | undefined>(routingEntry.messageStoreId);
  const [schedulerId, setSchedulerId] = useState<number | undefined>(routingEntry.schedulerId);
  const [isActive, setIsActive] = useState(routingEntry.isActive);
  const [featureFlags, setFeatureFlags] = useState(
    routingEntry.featureFlags ? JSON.stringify(routingEntry.featureFlags, null, 2) : '{}'
  );
  const [config, setConfig] = useState(
    routingEntry.config ? JSON.stringify(routingEntry.config, null, 2) : '{}'
  );

  // Load message stores for dropdown
  useEffect(() => {
    const loadMessageStores = async () => {
      try {
        const companyProjectId =
          typeof selectedCompanyProjectId === 'number' && selectedCompanyProjectId > 0
            ? selectedCompanyProjectId
            : undefined;
        const data = await listMessageStores(undefined, companyProjectId);
        setMessageStores(data);
      } catch (err) {
        console.error('Error loading message stores:', err);
      }
    };
    if (open) {
      loadMessageStores();
    }
  }, [open, selectedCompanyProjectId]);

  // Reset form when dialog opens with new entry
  useEffect(() => {
    if (open) {
      setSourceId(routingEntry.sourceId);
      setInitSegment(routingEntry.initSegment);
      setLanguageCode(routingEntry.languageCode || '');
      setMessageStoreId(routingEntry.messageStoreId);
      setSchedulerId(routingEntry.schedulerId);
      setIsActive(routingEntry.isActive);
      setFeatureFlags(
        routingEntry.featureFlags ? JSON.stringify(routingEntry.featureFlags, null, 2) : '{}'
      );
      setConfig(routingEntry.config ? JSON.stringify(routingEntry.config, null, 2) : '{}');
    }
  }, [open, routingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate and parse JSON fields
      let parsedFeatureFlags: Record<string, unknown> | undefined;
      let parsedConfig: Record<string, unknown> | undefined;

      try {
        parsedFeatureFlags = featureFlags.trim() ? JSON.parse(featureFlags) : undefined;
      } catch {
        toast.error('Invalid JSON in Feature Flags field');
        setLoading(false);
        return;
      }

      try {
        parsedConfig = config.trim() ? JSON.parse(config) : undefined;
      } catch {
        toast.error('Invalid JSON in Config field');
        setLoading(false);
        return;
      }

      // Call update API
      await updateRoutingEntry(routingEntry.routingTableId, {
        sourceId: sourceId.trim(),
        initSegment: initSegment.trim(),
        languageCode: languageCode.trim() || undefined,
        messageStoreId: messageStoreId || undefined,
        schedulerId: schedulerId || undefined,
        featureFlags: parsedFeatureFlags,
        config: parsedConfig,
      });

      // Invalidate caches to refresh data
      queryClient.invalidateQueries({ queryKey: ['routing-entries'] });

      toast.success('Routing entry updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err) || 'Failed to update routing entry';
      toast.error('Update Failed', {
        description: errorMessage,
      });
      console.error('Error updating routing entry:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-slate-900">Edit Routing Entry</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update the routing configuration for {routingEntry.routingId}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="space-y-6 py-4">
              {/* Read-only Information Section */}
              <div className="space-y-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                  Routing Information
                </h3>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Routing ID</Label>
                  <Input
                    value={routingEntry.routingId}
                    className="bg-slate-50/50"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Routing Table ID</Label>
                  <Input
                    value={routingEntry.routingTableId}
                    className="bg-slate-50/50 font-mono text-sm"
                    disabled
                  />
                </div>
              </div>

              {/* Basic Configuration Section */}
              <div className="space-y-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                  Basic Configuration
                </h3>
                {/* Source ID */}
                <div className="space-y-2">
                  <Label htmlFor="sourceId" className="text-slate-700 font-medium">
                    Source ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sourceId"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                {/* Initial Segment */}
                <div className="space-y-2">
                  <Label htmlFor="initSegment" className="text-slate-700 font-medium">
                    Initial Segment <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="initSegment"
                    value={initSegment}
                    onChange={(e) => setInitSegment(e.target.value)}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                {/* Language Code */}
                <div className="space-y-2">
                  <Label htmlFor="languageCode" className="text-slate-700 font-medium">
                    Language Code
                  </Label>
                  <Input
                    id="languageCode"
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    placeholder="e.g., en-US, nl-NL"
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Message Store */}
                <div className="space-y-2">
                  <Label htmlFor="messageStoreId" className="text-slate-700 font-medium">
                    Message Store
                  </Label>
                  <Select
                    value={messageStoreId?.toString() || 'none'}
                    onValueChange={(value) => setMessageStoreId(value === 'none' ? undefined : parseInt(value, 10))}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Select message store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {messageStores.map((store) => (
                        <SelectItem key={store.messageStoreId} value={store.messageStoreId.toString()}>
                          {store.name} <span className="text-xs text-slate-500">ID:{store.messageStoreId}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Scheduler ID */}
                <div className="space-y-2">
                  <Label htmlFor="schedulerId" className="text-slate-700 font-medium">
                    Scheduler ID
                  </Label>
                  <Input
                    id="schedulerId"
                    type="number"
                    value={schedulerId || ''}
                    onChange={(e) => setSchedulerId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="Optional"
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between rounded-md border border-slate-200/60 p-4">
                  <div>
                    <Label htmlFor="isActive" className="text-slate-700 font-medium cursor-pointer">
                      Active Status
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      {isActive ? 'This routing entry is currently active' : 'This routing entry is inactive'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              {/* Advanced Settings Section */}
              <div className="space-y-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                  Advanced Settings
                </h3>

                {/* Feature Flags */}
                <div className="space-y-2">
                  <Label htmlFor="featureFlags" className="text-slate-700 font-medium">
                    Feature Flags
                  </Label>
                  <JsonEditorComponent
                    id="featureFlags"
                    value={featureFlags}
                    onChange={setFeatureFlags}
                    placeholder='{"feature1": true, "feature2": false}'
                  />
                  <p className="text-xs text-slate-500">JSON format</p>
                </div>

                {/* Config */}
                <div className="space-y-2">
                  <Label htmlFor="config" className="text-slate-700 font-medium">
                    Config
                  </Label>
                  <JsonEditorComponent
                    id="config"
                    value={config}
                    onChange={setConfig}
                    placeholder='{"key1": "value1", "key2": "value2"}'
                  />
                  <p className="text-xs text-slate-500">JSON format</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t border-slate-200 flex items-center justify-between gap-4 bg-white">
            <div className="flex-1"></div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={loading}
                className="border-slate-300 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

