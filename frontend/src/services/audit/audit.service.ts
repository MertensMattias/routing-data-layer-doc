import apiClient from '@/api/client';

export interface AuditLog {
  auditId: number;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: Record<string, unknown>;
  responseStatus: 'success' | 'error';
  errorMessage?: string;
}

export interface AuditLogQuery {
  userId?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Fetch audit logs with optional filters
 */
export const queryAuditLogs = async (query: AuditLogQuery): Promise<AuditLog[]> => {
  const params: Record<string, string> = {};

  if (query.userId) params.userId = query.userId;
  if (query.entityType) params.entityType = query.entityType;
  if (query.entityId) params.entityId = query.entityId;
  if (query.startDate) params.startDate = query.startDate.toISOString();
  if (query.endDate) params.endDate = query.endDate.toISOString();
  if (query.limit) params.limit = query.limit.toString();
  if (query.offset) params.offset = query.offset.toString();

  const response = await apiClient.get<AuditLog[]>('/audit/logs', { params });
  return response.data;
};

/**
 * Export audit logs as CSV or JSON
 */
export const exportAuditLogs = async (
  startDate: Date,
  endDate: Date,
  format: 'csv' | 'json' = 'csv'
): Promise<Blob> => {
  const params = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    format,
  };

  // Backend returns JSON with { data, contentType, filename }
  const response = await apiClient.get<{ data: string; contentType: string; filename: string }>(
    '/audit/export',
    { params }
  );

  // Convert the data string to a Blob with proper content type
  const blob = new Blob([response.data.data], { type: response.data.contentType });
  return blob;
};

/**
 * Get entity change history
 */
export const getEntityHistory = async (
  entityType: string,
  entityId: string
): Promise<AuditLog[]> => {
  const response = await apiClient.get<AuditLog[]>(
    `/audit/history/${entityType}/${entityId}`
  );
  return response.data;
};

