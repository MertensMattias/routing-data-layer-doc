/**
 * Company Project Types
 * Shared types for company project context and API responses
 */

export interface CompanyProject {
  companyProjectId: number;
  customerId: string;
  projectId: string;
  displayName: string;
  description?: string;
  oktaGroup: string;
  isActive: boolean;
  dateCreated: Date;
  createdBy?: string;
  dateUpdated: Date;
  updatedBy?: string;
}

export interface CompanyProjectStats {
  companyProjectId: number;
  messageStoreCount: number;
  routingTableCount: number;
  segmentCount: number;
}

export interface CompanyProjectContextState {
  // Selected company project (null = "All Projects")
  selectedCompanyProjectId: number | null;

  // Available projects for current user
  availableProjects: CompanyProject[];

  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;

  // Error state
  error: string | null;

  // Stats for display
  stats: CompanyProjectStats[];

  // Actions
  setSelectedCompanyProjectId: (id: number | null) => void;
  refreshProjects: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Computed helper
  getCurrentProject: () => CompanyProject | null;
}
