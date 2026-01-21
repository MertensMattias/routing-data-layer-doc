'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CompanyProject,
  CompanyProjectStats,
  CompanyProjectContextState,
} from '@/types/company-project.types';
import { listProjects, getProjectStats } from '@/services/company-project';
import { getApiErrorMessage } from '@/api/client';

/**
 * CompanyProjectContext provides access to:
 * - Selected company project ID
 * - Available projects for current user
 * - Project statistics (resource counts)
 * - Methods to change selection and refresh data
 */
const CompanyProjectContext = createContext<CompanyProjectContextState | undefined>(undefined);

interface CompanyProjectContextProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'selectedCompanyProjectId';

export function CompanyProjectContextProvider({
  children,
}: CompanyProjectContextProviderProps) {
  const [selectedCompanyProjectId, setSelectedCompanyProjectIdState] = useState<
    number | null
  >(null);
  const [availableProjects, setAvailableProjects] = useState<CompanyProject[]>([]);
  const [stats, setStats] = useState<CompanyProjectStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch projects and stats on mount
   */
  useEffect(() => {
    const initializeProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch available projects
        const projects = await listProjects();
        setAvailableProjects(projects);

        // Restore selected project from localStorage
        const storedId = localStorage.getItem(STORAGE_KEY);
        let selectedId: number | null = null;

        if (storedId) {
          const parsedId = parseInt(storedId, 10);
          // Validate the stored ID still exists in available projects
          const projectExists = projects.some(
            (p) => p.companyProjectId === parsedId
          );
          if (projectExists) {
            selectedId = parsedId;
          }
        }

        // If no stored selection and projects are available, auto-select the first one
        if (selectedId === null && projects.length > 0) {
          selectedId = projects[0].companyProjectId;
        }

        // Use the setter to ensure proper persistence
        if (selectedId !== null) {
          setSelectedCompanyProjectIdState(selectedId);
          localStorage.setItem(STORAGE_KEY, selectedId.toString());
        } else {
          setSelectedCompanyProjectIdState(null);
        }

        // Fetch stats
        await refreshStats();
      } catch (err: unknown) {
        setError(getApiErrorMessage(err) || 'Failed to load company projects');
      } finally {
        setIsLoading(false);
      }
    };

    initializeProjects();
  }, []);

  /**
   * Fetch and cache stats
   */
  const refreshStats = async () => {
    try {
      setIsLoadingStats(true);
      const projectStats = await getProjectStats();
      setStats(projectStats);
    } catch (err: unknown) {
      console.error('Failed to load project stats:', getApiErrorMessage(err) || 'Unknown error', err);
      // Don't set error state here - stats failure shouldn't block the UI
    } finally {
      setIsLoadingStats(false);
    }
  };

  /**
   * Update selected company project
   */
  const setSelectedCompanyProjectId = (id: number | null) => {
    setSelectedCompanyProjectIdState(id);
    // Persist to localStorage
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, id.toString());
    }
  };

  /**
   * Refresh projects from API
   */
  const refreshProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const projects = await listProjects();
      setAvailableProjects(projects);

      // Validate current selection still exists
      if (
        selectedCompanyProjectId !== null &&
        !projects.some((p) => p.companyProjectId === selectedCompanyProjectId)
      ) {
        // Selected project no longer accessible, reset to "All Projects"
        setSelectedCompanyProjectIdState(null);
        localStorage.removeItem(STORAGE_KEY);
      }

      // Refresh stats as well
      await refreshStats();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to refresh projects');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get currently selected project
   */
  const getCurrentProject = (): CompanyProject | null => {
    if (selectedCompanyProjectId === null) {
      return null;
    }
    return (
      availableProjects.find(
        (p) => p.companyProjectId === selectedCompanyProjectId
      ) || null
    );
  };

  const value: CompanyProjectContextState = {
    selectedCompanyProjectId,
    availableProjects,
    stats,
    isLoading,
    isLoadingStats,
    error,
    setSelectedCompanyProjectId,
    refreshProjects,
    refreshStats,
    getCurrentProject,
  };

  return (
    <CompanyProjectContext.Provider value={value}>
      {children}
    </CompanyProjectContext.Provider>
  );
}

/**
 * Hook to use the CompanyProjectContext
 */
export function useCompanyProjectContext(): CompanyProjectContextState {
  const context = useContext(CompanyProjectContext);
  if (context === undefined) {
    throw new Error(
      'useCompanyProjectContext must be used within CompanyProjectContextProvider'
    );
  }
  return context;
}

