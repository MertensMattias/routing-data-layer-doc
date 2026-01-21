import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { ExportImportService } from '@/services/shared';
import { getApiErrorMessage } from '@/api/client';

// Singleton service instance
const exportImportService = new ExportImportService();

// Import report type matching backend - accepts flexible structure
type ImportReport = {
  isValid?: boolean;
  validatedAt?: string;
  summary?: {
    flows?: { willCreate?: number; willUpdate?: number; willSkip?: number };
    messages?: { willCreate?: number; willUpdate?: number; willSkip?: number };
    routing?: { willCreate?: number; willUpdate?: number; willSkip?: number };
  };
  conflicts?: Array<{
    [key: string]: unknown;
  }>;
  errors?: string[];
  warnings?: string[];
  previewChanges?: {
    affectedFlows?: string[];
    affectedMessages?: string[];
    affectedRoutingEntries?: string[];
  };
  [key: string]: unknown;
}

export function useExportImport(moduleType: 'flows' | 'messages' | 'routing') {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ImportReport | null>(null);
  const service = useMemo(() => exportImportService, []);

  async function doPreviewImport(
    file: File,
    overwrite?: boolean,
    routingId?: string,
  ) {
    try {
      setIsLoading(true);
      const result = await service.previewImport(moduleType, file, overwrite, routingId);
      setPreview(result);
      return result;
    } catch (error: unknown) {
      toast.error('Preview Failed', {
        description: getApiErrorMessage(error) || 'Failed to preview import',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function doImport(file: File, overwrite?: boolean, routingId?: string) {
    try {
      setIsLoading(true);
      const result = await service.importData(moduleType, file, {
        overwrite,
        routingId,
      });

      // For flows, show draft-first workflow message
      if (moduleType === 'flows' && result.changeSetId) {
        toast.success('Flow imported as draft', {
          description: `Created: ${result.importedCount || 0}, Updated: ${result.updatedCount || 0}. Review before publishing.`,
        });
      } else {
        toast.success('Import Successful', {
          description: `Import completed successfully`,
        });
      }

      return result;
    } catch (error: unknown) {
      toast.error('Import Failed', {
        description: getApiErrorMessage(error) || 'Failed to import data',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    preview,
    previewImport: doPreviewImport,
    import: doImport,
  };
}

