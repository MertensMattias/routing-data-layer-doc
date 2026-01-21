'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExportImportService } from '@/services/shared';
import { FileHandlerService } from '@/services/shared';
import { Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';

export default function FlowExportPage() {
  const [includeMessages, setIncludeMessages] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const service = new ExportImportService();

  async function handleExport() {
    try {
      setIsExporting(true);
      const blob = await service.exportData({
        moduleType: 'flows',
        includeContent: includeMessages,
      });

      const filename = FileHandlerService.generateExportFilename('flows');
      FileHandlerService.downloadFile(blob, filename);

      toast.success('Export Successful', {
        description: `Flows exported to ${filename}`,
      });
    } catch (error: unknown) {
      toast.error('Export Failed', {
        description: getApiErrorMessage(error) || 'Failed to export flows',
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Export Flows</h1>
          <p className="text-muted-foreground mt-2">Export your call flows for backup or sharing</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Export Options
            </CardTitle>
            <CardDescription>Choose what to include in the export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox
                  checked={!includeMessages}
                  onCheckedChange={() => setIncludeMessages(false)}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">Manifest Only (Recommended)</p>
                  <p className="text-xs text-muted-foreground">
                    Includes segment structure and transitions, but not message content. ~50-200 KB
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Lightweight
                  </Badge>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox
                  checked={includeMessages}
                  onCheckedChange={() => setIncludeMessages(true)}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">With Full Content</p>
                  <p className="text-xs text-muted-foreground">
                    Includes all message content and configurations. Self-contained export. 1-10 MB
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Self-Contained
                  </Badge>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleExport} disabled={isExporting} size="lg" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Flows'}
        </Button>
      </div>
    </div>
  );
}

