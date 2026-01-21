import { useState, useMemo } from 'react';
import React from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { SaveButton } from './SaveButton';
import { PublishButton } from './PublishButton';
import { ValidateButton } from './ValidateButton';
import { DiscardButton } from './DiscardButton';
import { ValidationSummary } from '@/features/flow-designer/components/validation/ValidationSummary';
import { ImportDialog } from '@/features/flow-designer/components/import-export/ImportDialog';
import { ExportDialog } from '@/features/flow-designer/components/import-export/ExportDialog';
import { VersionSelector } from '@/features/flow-designer/components/VersionSelector';
import { CreateDraftDialog } from '@/features/flow-designer/components/dialogs/CreateDraftDialog';
import { SearchFilter } from './SearchFilter';
import { RoutingSelector } from './RoutingSelector';
import { Download, Upload, HelpCircle, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { extractContextKeys } from '@/features/flow-designer/utils/flow-transform';
import { getFlow } from '@/services/flows/flows.service';
import { toast } from 'sonner';

/**
 * Main toolbar for flow actions
 */
export const FlowToolbar: React.FC = () => {
  const { flow, isDirty, lastSaved, selectedContextKey, setSelectedContextKey, loadFlow, hasCustomPositions, clearCustomPositions, hasUnsavedChanges, saveFlow, clearFlow } = useFlowStore();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateDraftDialog, setShowCreateDraftDialog] = useState(false);
  // Version change unsaved dialog state
  const [showVersionUnsavedDialog, setShowVersionUnsavedDialog] = useState(false);
  const [pendingChangeSetId, setPendingChangeSetId] = useState<string | null>(null);
  const [isVersionSaving, setIsVersionSaving] = useState(false);

  // Extract context keys from flow
  const contextKeys = useMemo(() => {
    if (!flow) return [];
    return extractContextKeys(flow);
  }, [flow]);

  if (!flow) {
    return null;
  }

  const isDraft = !!flow.changeSetId;

  const handleVersionChange = async (changeSetId: string | null) => {
    // Check for unsaved changes first
    if (hasUnsavedChanges()) {
      setPendingChangeSetId(changeSetId);
      setShowVersionUnsavedDialog(true);
      return;
    }
    await loadVersion(changeSetId);
  };

  const loadVersion = async (changeSetId: string | null) => {
    try {
      clearFlow(); // Clear old flow to prevent flash
      const newFlow = await getFlow(flow.routingId, changeSetId || undefined);
      loadFlow(newFlow as any);
      toast.success(`Switched to ${changeSetId ? 'draft' : 'published'} version`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load version: ${message}`);
    }
  };

  const handleVersionDiscardAndSwitch = () => {
    loadVersion(pendingChangeSetId);
    setShowVersionUnsavedDialog(false);
    setPendingChangeSetId(null);
  };

  const handleVersionSaveAndSwitch = async () => {
    setIsVersionSaving(true);
    try {
      await saveFlow();
      toast.success('Changes saved');
      await loadVersion(pendingChangeSetId);
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsVersionSaving(false);
      setShowVersionUnsavedDialog(false);
      setPendingChangeSetId(null);
    }
  };

  const handleVersionCancelSwitch = () => {
    setShowVersionUnsavedDialog(false);
    setPendingChangeSetId(null);
  };

  const handleDraftCreated = async (changeSetId: string) => {
    try {
      const newFlow = await getFlow(flow.routingId, changeSetId);
      loadFlow(newFlow as any);
      toast.success('Draft created and loaded');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load new draft: ${message}`);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Flow Info */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {flow.name || flow.routingId}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {isDraft ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Draft
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Published
                  </span>
                )}
              </span>
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Last saved: {formatRelativeTime(lastSaved)}
                </span>
              )}
              {isDirty && (
                <span className="text-xs text-orange-600 font-medium">• Unsaved changes</span>
              )}
            </div>
          </div>
          {/* Search/Filter */}
          <div className="border-l border-gray-200 pl-4 ml-2">
            <SearchFilter />
          </div>
        </div>

        {/* Center: Validation Summary */}
        <div>
          <ValidationSummary />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Routing Selector - shown when project has multiple routing entries */}
          {flow.companyProjectId && (
            <RoutingSelector
              currentRoutingId={flow.routingId}
              companyProjectId={flow.companyProjectId}
            />
          )}
          {/* Version Selector */}
          <VersionSelector
            routingId={flow.routingId}
            onVersionChange={handleVersionChange}
          />
          {/* Create Draft Button */}
          {!isDraft && (
            <Button
              onClick={() => setShowCreateDraftDialog(true)}
              variant="outline"
              size="sm"
              className="inline-flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Draft
            </Button>
          )}
          {/* Reset Layout Button - only shown when custom positions exist */}
          {hasCustomPositions && (
            <Button
              onClick={clearCustomPositions}
              variant="outline"
              size="sm"
              className="inline-flex items-center"
              title="Reset all nodes to automatic layout"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Layout
            </Button>
          )}
          {/* Context Key Selector */}
          {contextKeys.length > 0 && (
            <Select
              value={selectedContextKey || 'none'}
              onValueChange={(value) => setSelectedContextKey(value === 'none' ? null : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by context key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Base Layout (All)</SelectItem>
                {contextKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Export Button */}
          <Button
            onClick={() => setShowExportDialog(true)}
            variant="outline"
            size="sm"
            className="inline-flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {/* Import Button */}
          <Button
            onClick={() => setShowImportDialog(true)}
            variant="outline"
            size="sm"
            className="inline-flex items-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <ValidateButton />
          <SaveButton />
          {isDraft && (
            <>
              <PublishButton />
              <DiscardButton />
            </>
          )}
          {/* Keyboard Shortcuts Help */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Keyboard shortcuts help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Save flow</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Validate flow</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Shift+V</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Clear selection</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Escape</kbd>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Dialogs */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        routingId={flow.routingId}
      />
      <CreateDraftDialog
        routingId={flow.routingId}
        open={showCreateDraftDialog}
        onOpenChange={setShowCreateDraftDialog}
        onDraftCreated={handleDraftCreated}
      />

      {/* Version Change Unsaved Changes Dialog */}
      <AlertDialog open={showVersionUnsavedDialog} onOpenChange={setShowVersionUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the current flow. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleVersionCancelSwitch} disabled={isVersionSaving}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleVersionDiscardAndSwitch}
              disabled={isVersionSaving}
            >
              Discard Changes
            </Button>
            <AlertDialogAction onClick={handleVersionSaveAndSwitch} disabled={isVersionSaving}>
              {isVersionSaving ? 'Saving...' : 'Save & Switch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}



