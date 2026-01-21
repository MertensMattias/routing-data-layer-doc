import apiClient from '@/api/client';

export interface ExportOptions {
  moduleType: 'flows' | 'messages' | 'routing';
  filters?: Record<string, string[]>;
  includeContent?: boolean;
  includeHistory?: boolean;
  /** Required for flows module - the routing ID to export */
  routingId?: string;
}

export interface ImportOptions {
  moduleType: 'flows' | 'messages' | 'routing';
  overwrite?: boolean;
  validateOnly?: boolean;
}

export class ExportImportService {
  /**
   * Export data from any module
   */
  async exportData(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams();

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, values]) => {
        if (values.length > 0) {
          params.append(key, values.join(','));
        }
      });
    }

    if (options.includeContent) {
      params.append('includeContent', 'true');
    }

    if (options.includeHistory) {
      params.append('includeHistory', 'true');
    }

    const url = this.buildExportUrl(options.moduleType, params, options.routingId);
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    // Format JSON with proper indentation (2 spaces)
    const blob = response.data;
    const text = await blob.text();

    // Try to parse and format JSON, fallback to original if parsing fails
    try {
      const jsonData = JSON.parse(text);
      const formattedJson = JSON.stringify(jsonData, null, 2);
      return new Blob([formattedJson], { type: 'application/json' });
    } catch {
      // If JSON parsing fails, return original blob (might be an error response)
      return blob;
    }
  }

  /**
   * Preview import changes
   *
   * For flows: wraps the export data in FlowImportDto format
   * Backend expects: { routingId, flowData: CompleteFlowDto }
   */
  async previewImport(
    moduleType: string,
    file: File,
    overwrite?: boolean,
    routingId?: string,
  ): Promise<{
    isValid: boolean;
    validatedAt: string;
    willCreate?: number;
    willUpdate?: number;
    willDelete?: number;
    conflicts?: Array<{
      suggestedAction: 'skip' | 'update';
      [key: string]: unknown;
    }>;
    summary?: {
      flows?: { willCreate: number; willUpdate: number; willSkip?: number };
      messages?: { willCreate: number; willUpdate: number; willSkip?: number };
      routing?: { willCreate: number; willUpdate: number; willSkip?: number };
    };
    previewChanges?: {
      affectedFlows?: string[];
      affectedMessages?: string[];
      affectedRoutingEntries?: string[];
    };
  }> {
    const fileContent = await this.readFileAsText(file);
    const exportData = JSON.parse(fileContent);

    const url = this.buildPreviewUrl(moduleType, routingId);

    // Build request body based on module type
    // Flows use FlowImportDto format: { routingId, flowData }
    let requestBody: Record<string, unknown>;
    if (moduleType === 'flows') {
      // Export format IS the CompleteFlowDto, wrap it in FlowImportDto
      const targetRoutingId = routingId || exportData.routingId;
      if (!targetRoutingId) {
        throw new Error('routingId is required for flows preview');
      }
      requestBody = {
        routingId: targetRoutingId,
        flowData: exportData, // The exported file content IS the CompleteFlowDto
      };
    } else {
      // Other modules use the generic format
      requestBody = {
        exportData,
        overwrite,
      };
    }

    const response = await apiClient.post(url, requestBody);
    return response.data;
  }

  /**
   * Perform actual import
   *
   * For flows: wraps the export data in FlowImportDto format
   * Backend expects: { routingId, flowData: CompleteFlowDto }
   */
  async importData(
    moduleType: string,
    file: File,
    options?: { overwrite?: boolean; validateOnly?: boolean; routingId?: string },
  ): Promise<{
    success: boolean;
    routingId?: string;
    changeSetId?: string;
    importedCount?: number;
    updatedCount?: number;
    deletedCount?: number;
    skippedCount?: number;
    errors?: string[];
    [key: string]: unknown;
  }> {
    const fileContent = await this.readFileAsText(file);
    const exportData = JSON.parse(fileContent);

    const url = this.buildImportUrl(moduleType, options?.routingId);
    const params = new URLSearchParams();
    if (options?.overwrite) {
      params.append('overwrite', 'true');
    }
    if (options?.validateOnly) {
      params.append('validateOnly', 'true');
    }

    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

    // Build request body based on module type
    // Flows use FlowImportDto format: { routingId, flowData }
    // Other modules use generic format
    let requestBody: Record<string, unknown>;
    if (moduleType === 'flows') {
      // Export format IS the CompleteFlowDto, wrap it in FlowImportDto
      const routingId = options?.routingId || exportData.routingId;
      if (!routingId) {
        throw new Error('routingId is required for flows import');
      }
      requestBody = {
        routingId,
        flowData: exportData, // The exported file content IS the CompleteFlowDto
      };
    } else {
      // Other modules use the generic format
      requestBody = {
        exportData,
        overwrite: options?.overwrite,
        validateOnly: options?.validateOnly,
      };
    }

    const response = await apiClient.post(fullUrl, requestBody);
    return response.data;
  }

  /**
   * Batch preview (multiple modules)
   */
  async batchPreview(
    files: Record<string, File>,
    overwrite?: boolean
  ): Promise<Record<string, {
    isValid: boolean;
    validatedAt: string;
    conflicts?: Array<{
      suggestedAction: 'skip' | 'update';
      [key: string]: unknown;
    }>;
    summary?: {
      flows?: { willCreate: number; willUpdate: number; willSkip?: number };
      messages?: { willCreate: number; willUpdate: number; willSkip?: number };
      routing?: { willCreate: number; willUpdate: number; willSkip?: number };
    };
    [key: string]: unknown;
  }>> {
    const batch: Record<string, unknown> = {};

    for (const [moduleType, file] of Object.entries(files)) {
      const content = await this.readFileAsText(file);
      batch[moduleType] = JSON.parse(content);
    }

    const response = await apiClient.post('/api/v1/import/preview/batch', {
      ...batch,
      overwrite,
    });

    return response.data;
  }

  /**
   * Batch import (multiple modules)
   */
  async batchImport(
    files: Record<string, File>,
    overwrite?: boolean
  ): Promise<Record<string, {
    success: boolean;
    message?: string;
    importedCount?: number;
    updatedCount?: number;
    skippedCount?: number;
    errors?: string[];
    [key: string]: unknown;
  }>> {
    const batch: Record<string, unknown> = {};

    for (const [moduleType, file] of Object.entries(files)) {
      const content = await this.readFileAsText(file);
      batch[moduleType] = JSON.parse(content);
    }

    const response = await apiClient.post('/api/v1/import/batch', {
      ...batch,
      overwrite,
    });

    return response.data;
  }

  private buildExportUrl(moduleType: string, params: URLSearchParams, routingId?: string): string {
    // Note: apiClient baseURL already includes '/api/v1', so paths should not include it
    let base: string;

    if (moduleType === 'flows') {
      if (!routingId) {
        throw new Error('routingId is required for flows export');
      }
      base = `/segments/flows/${routingId}/export`;
    } else if (moduleType === 'messages') {
      base = '/messages/stores/export';
    } else if (moduleType === 'routing') {
      base = '/routing/export';
    } else {
      throw new Error(`Unknown module type: ${moduleType}`);
    }

    return params.toString() ? `${base}?${params.toString()}` : base;
  }

  private buildPreviewUrl(moduleType: string, routingId?: string): string {
    // Note: apiClient baseURL already includes '/api/v1', so paths should not include it
    const baseUrl = {
      flows: '/segments/flows',
      messages: '/messages',
      routing: '/routing',
    }[moduleType];

    if (!baseUrl) {
      throw new Error(`Unknown module type: ${moduleType}`);
    }

    // Flows require routingId in the path
    if (moduleType === 'flows') {
      if (!routingId) {
        throw new Error('routingId is required for flows preview');
      }
      return `${baseUrl}/${routingId}/import/preview`;
    }

    // Messages require /stores in the path
    if (moduleType === 'messages') {
      return `${baseUrl}/stores/import/preview`;
    }

    return `${baseUrl}/import/preview`;
  }

  private buildImportUrl(moduleType: string, routingId?: string): string {
    // Note: apiClient baseURL already includes '/api/v1', so paths should not include it
    const baseUrl = {
      flows: '/segments/flows',
      messages: '/messages',
      routing: '/routing',
    }[moduleType];

    if (!baseUrl) {
      throw new Error(`Unknown module type: ${moduleType}`);
    }

    // Flows require routingId in the path
    if (moduleType === 'flows') {
      if (!routingId) {
        throw new Error('routingId is required for flows import');
      }
      return `${baseUrl}/${routingId}/import`;
    }

    // Messages require /stores in the path
    if (moduleType === 'messages') {
      return `${baseUrl}/stores/import`;
    }

    return `${baseUrl}/import`;
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

