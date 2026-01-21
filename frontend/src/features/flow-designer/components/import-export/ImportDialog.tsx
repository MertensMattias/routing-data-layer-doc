import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { importFlow } from '@/services/flows/flows-export.service';
import { previewFlowImport } from '@/services/flows/flows-export.service';
import type { ImportPreview } from '@/api/types';
import { ImportPreview as ImportPreviewComponent } from './ImportPreview';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CompleteFlow } from '@/api/types';
import { getApiErrorMessage } from '@/api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  routingId?: string;
}

type ImportMode = 'create' | 'overwrite' | 'merge';

/**
 * Import flow dialog
 */
export const ImportDialog: React.FC<Props> = ({ isOpen, onClose, routingId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [flowData, setFlowData] = useState<CompleteFlow | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [acknowledgedUnsavedChanges, setAcknowledgedUnsavedChanges] = useState(false);
  const navigate = useNavigate();
  const hasUnsavedChanges = useFlowStore((state) => state.hasUnsavedChanges);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFlowData(json);
      } catch {
        toast.error('Invalid JSON file');
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  }, []);

  const handlePreview = async () => {
    if (!flowData || !routingId) {
      toast.error('Missing required information for import');
      return;
    }

    // Check for unsaved changes - require acknowledgement
    if (hasUnsavedChanges() && !acknowledgedUnsavedChanges) {
      const shouldProceed = window.confirm(
        'You have unsaved changes that will be lost when importing. Continue?'
      );
      if (!shouldProceed) return;
      setAcknowledgedUnsavedChanges(true);
    }

    setIsLoading(true);
    try {
      const previewResult = await previewFlowImport(routingId, flowData as any);
      setPreview(previewResult);
      setStep('preview');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || 'Failed to preview import');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!flowData || !routingId) return;
    setStep('importing');
    setIsLoading(true);
    try {
      const result = await importFlow(routingId, flowData as any, { overwrite: importMode === 'overwrite' });

      // Show success with import summary
      const summary = `Created: ${result.importedCount}, Updated: ${result.updatedCount}`;
      toast.success('Flow imported as draft', {
        description: `${summary}. Review changes before publishing.`,
      });

      onClose();

      // Navigate to flow designer with the draft changeSetId for review
      // The changeSetId query param tells flow designer to load the draft
      if (result.changeSetId) {
        navigate(`/flows/${result.routingId}?changeSetId=${result.changeSetId}`);
      } else {
        navigate(`/flows/${result.routingId}`);
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || 'Failed to import flow');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('upload');
    setPreview(null);
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setFlowData(null);
    setPreview(null);
    setAcknowledgedUnsavedChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Flow</DialogTitle>
          <DialogDescription>
            Import a flow from a JSON file
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Select Flow JSON File
              </Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">JSON files only</p>
                </div>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            {/* Import Mode */}
            {flowData && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Mode
                </Label>
                <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)} className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="create" id="create" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="create" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Create New
                      </Label>
                      <p className="text-sm text-gray-500">
                        Create a new routing (fails if routingId already exists)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="overwrite" id="overwrite" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="overwrite" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Overwrite
                      </Label>
                      <p className="text-sm text-gray-500">
                        Replace all segments in existing flow
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="merge" id="merge" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="merge" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Merge
                      </Label>
                      <p className="text-sm text-gray-500">
                        Add/update segments, keep others (recommended)
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!flowData || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Preview'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && preview && flowData && (
          <div className="space-y-4">
            <ImportPreviewComponent preview={preview} flowData={flowData} />
            <DialogFooter>
              <Button
                onClick={handleBack}
                disabled={isLoading}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || (preview.conflicts && preview.conflicts.length > 0)}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="ml-3 text-gray-600">Importing flow...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};



