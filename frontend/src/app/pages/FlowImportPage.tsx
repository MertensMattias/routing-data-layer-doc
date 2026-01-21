'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportPreview } from '@/components/common';
import { FileHandlerService } from '@/services/shared';
import { useExportImport } from '@/hooks/useExportImport';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';

export default function FlowImportPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileError, setFileError] = useState('');
  const { isLoading, preview, previewImport, import: doImport } = useExportImport('flows');

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError('');

    // Validate file
    const sizeMB = FileHandlerService.getFileSizeInMB(file);
    if (sizeMB > 50) {
      setFileError('File is too large (max 50 MB)');
      return;
    }

    const isValid = await FileHandlerService.validateJsonFile(file);
    if (!isValid) {
      setFileError('File is not valid JSON');
      return;
    }

    setSelectedFile(file);
  }

  async function handlePreview() {
    if (!selectedFile) {
      setFileError('Please select a file');
      return;
    }

    try {
      // Extract routingId from file if available, otherwise it will error
      // For flows, routingId should be in the export file
      const fileContent = await selectedFile.text();
      const exportData = JSON.parse(fileContent);
      const routingId = exportData.routingId || exportData.flowData?.routingId;

      if (!routingId) {
        setFileError('Flow export file must contain routingId');
        return;
      }

      await previewImport(selectedFile, overwrite, routingId);
      setPreviewOpen(true);
    } catch (error: unknown) {
      setFileError(getApiErrorMessage(error) || 'Failed to preview import');
    }
  }

  async function handleConfirmImport() {
    if (!selectedFile) return;

    try {
      // Extract routingId from file
      const fileContent = await selectedFile.text();
      const exportData = JSON.parse(fileContent);
      const routingId = exportData.routingId || exportData.flowData?.routingId;

      if (!routingId) {
        toast.error('Import Failed', {
          description: 'Flow export file must contain routingId',
        });
        return;
      }

      const result = await doImport(selectedFile, overwrite, routingId);

      // Navigate to flow designer with draft changeSetId for review
      if (result.changeSetId && result.routingId) {
        setTimeout(() => navigate(`/flows/${result.routingId}?changeSetId=${result.changeSetId}`), 500);
      } else if (result.routingId) {
        setTimeout(() => navigate(`/flows/${result.routingId}`), 500);
      } else {
        setTimeout(() => navigate('/flows'), 500);
      }
    } catch {
      // Error handled by hook
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Flows</h1>
        <p className="text-muted-foreground mt-2">Upload a flow export file to import</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Select File
          </CardTitle>
          <CardDescription>Choose a JSON export file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            disabled={isLoading}
          />

          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({FileHandlerService.getFileSizeInMB(selectedFile).toFixed(2)} MB)
            </p>
          )}

          {fileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(checked === true)}
              disabled={isLoading}
            />
            <label htmlFor="overwrite" className="text-sm cursor-pointer">
              Overwrite existing flows
            </label>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handlePreview}
        disabled={!selectedFile || isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading ? 'Loading Preview...' : 'Preview Import'}
      </Button>

      <ImportPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={preview}
        onConfirm={handleConfirmImport}
        onCancel={() => setPreviewOpen(false)}
        isLoading={isLoading}
      />
    </div>
  );
}

