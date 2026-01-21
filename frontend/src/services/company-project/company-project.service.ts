import apiClient from '@/api/client';
import type {
  CompanyProject,
  CreateCompanyProjectDto,
  UpdateCompanyProjectDto,
} from '@/api/types';

/**
 * Company Project Service
 * Handles all API calls related to company projects
 */

/**
 * List all company projects
 */
export const listProjects = async (): Promise<CompanyProject[]> => {
  const response = await apiClient.get<CompanyProject[]>('/company-projects');
  return response.data;
};

/**
 * Get a single company project by ID
 */
export const getProject = async (id: number): Promise<CompanyProject> => {
  const response = await apiClient.get<CompanyProject>(`/company-projects/${id}`);
  return response.data;
};

/**
 * Create a new company project
 */
export const createProject = async (
  data: CreateCompanyProjectDto
): Promise<CompanyProject> => {
  const response = await apiClient.post<CompanyProject>('/company-projects', data);
  return response.data;
};

/**
 * Update an existing company project
 */
export const updateProject = async (
  id: number,
  data: UpdateCompanyProjectDto
): Promise<CompanyProject> => {
  const response = await apiClient.put<CompanyProject>(
    `/company-projects/${id}`,
    data
  );
  return response.data;
};

/**
 * Delete a company project
 */
export const deleteProject = async (id: number): Promise<void> => {
  await apiClient.delete(`/company-projects/${id}`);
};

/**
 * Get statistics for all accessible company projects
 * Returns resource counts (message stores, routing tables, segments) per project
 */
export const getProjectStats = async (): Promise<
  Array<{
    companyProjectId: number;
    messageStoreCount: number;
    routingTableCount: number;
    segmentCount: number;
  }>
> => {
  const response = await apiClient.get('/company-projects/stats');
  return response.data;
};

