import apiClient from '@/api/client';
import type { HealthCheckResponse } from '@/api/types';

/**
 * Health Check Service
 * Monitors backend and database health
 */

/**
 * Get application health status
 */
export const getHealth = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<HealthCheckResponse>('/health');
  return response.data;
};

/**
 * Get database health status
 */
export const getDatabaseHealth = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<HealthCheckResponse>('/health/database');
  return response.data;
};

