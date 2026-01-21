'use client';

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ExportDialog, ImportDialog, ImportPreview } from '@/components/common';
import { SegmentFlowVisualization, SegmentOrderPanel } from '@/features/segments/components';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useExportImport } from '@/hooks/useExportImport';
import { autoOrderSegments, updateSegmentOrder } from '@/services/flows/flows-draft.service';
import type { SegmentSnapshot } from '@/api/types';
import { getApiErrorMessage } from '@/api/client';

export default function FlowEditorPage() {
  const params = useParams<{ routingId: string }>();
  const routingId = params.routingId || '';
  const navigate = useNavigate();

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const { isLoading, preview, previewImport, import: doImport } = useExportImport('flows');

  async function handleImportFileSelected(file: File, overwriteFlag: boolean) {
    setSelectedFile(file);
    setOverwrite(overwriteFlag);
    setImportDialogOpen(false);

    try {
      await previewImport(file, overwriteFlag, routingId);
      setPreviewOpen(true);
    } catch {
      // Error already handled by hook
    }
  }

  async function handleConfirmImport() {
    if (!selectedFile) return;

    try {
      const result = await doImport(selectedFile, overwrite, routingId);
      setPreviewOpen(false);
      setSelectedFile(null);

      // Navigate to flow designer with draft changeSetId for review
      if (result.changeSetId) {
        // Navigate to same routing with the new draft changeSetId
        navigate(`/flows/${routingId}?changeSetId=${result.changeSetId}`);
      } else {
        // Fallback: reload to refresh the flow
        window.location.reload();
      }
    } catch {
      // Error already handled by hook
    }
  }

  async function handleReorder(segments: SegmentSnapshot[]) {
    try {
      const segmentOrders = segments.map((seg, index) => ({
        segmentName: seg.segmentName,
        segmentOrder: index + 1,
      }));

      await updateSegmentOrder(routingId, segmentOrders);
      toast.success('Segment order updated successfully');
      // Refresh flow data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: unknown) {
      toast.error('Failed to update segment order', {
        description: getApiErrorMessage(error) || 'Failed to update segment order',
      });
      console.error('Error updating segment order:', error);
    }
  }

  async function handleAutoOrder() {
    try {
      const result = await autoOrderSegments(routingId);
      toast.success(`Segment order updated: ${result.updated} segments reordered`);
      // Refresh flow data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: unknown) {
      toast.error('Failed to auto-order segments', {
        description: getApiErrorMessage(error) || 'Failed to auto-order segments',
      });
      console.error('Error auto-ordering segments:', error);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Flow Editor</h1>
        <div className="flex gap-2">
          <Button onClick={() => setExportDialogOpen(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="h-[600px] w-full">
        <SegmentFlowVisualization />
      </div>

      {/* Segment Ordering Panel */}
      <SegmentOrderPanel
        segments={[]}
        onReorder={handleReorder}
        onAutoOrder={handleAutoOrder}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        moduleType="flows"
        title="Flows"
        routingId={routingId}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Flows"
        onFileSelected={handleImportFileSelected}
        isLoading={isLoading}
      />

      {/* Import Preview Dialog */}
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

