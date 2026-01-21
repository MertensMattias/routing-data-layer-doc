'use client';

import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { CompanyProject } from '@/types/company-project.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useLocation } from 'react-router-dom';

interface CompanyProjectSelectorProps {
  className?: string;
  size?: 'sm' | 'default';
}

/**
 * CompanyProjectSelector
 *
 * A dropdown component that allows users to select a company project
 * or view "All Projects" (when selectedCompanyProjectId is null).
 *
 * Features:
 * - Shows all available projects filtered by user's Okta groups
 * - Displays project ID and customer ID for clarity
 * - "All Projects" option to view data across all projects
 * - Loading state while fetching projects
 * - Disabled during API calls
 */
export function CompanyProjectSelector({ className, size = 'default' }: CompanyProjectSelectorProps) {
  const location = useLocation();
  const { selectedCompanyProjectId, availableProjects, isLoading, setSelectedCompanyProjectId } =
    useCompanyProjectContext();

  // Check if we're in the Flow Designer - disable project switching
  const isInDesigner = location.pathname.startsWith('/designer');

  // In Flow Designer: show read-only project badge instead of selector
  if (isInDesigner) {
    const currentProject = availableProjects.find(
      (p) => p.companyProjectId === selectedCompanyProjectId
    );
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="secondary" className="text-sm py-1.5 px-3">
          <Lock className="h-3 w-3 mr-1.5" />
          {currentProject?.displayName || 'Unknown Project'}
        </Badge>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          (locked while editing)
        </span>
      </div>
    );
  }

  // Convert null (All Projects) to string value for Select component
  const selectValue = selectedCompanyProjectId?.toString() ?? 'all';

  const handleValueChange = (value: string) => {
    if (value === 'all') {
      setSelectedCompanyProjectId(null);
    } else {
      setSelectedCompanyProjectId(parseInt(value, 10));
    }
  };

  return (
    <Select value={selectValue} onValueChange={handleValueChange} disabled={isLoading}>
      <SelectTrigger
        size={size}
        className={cn('w-full min-w-[200px]', className)}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Loading projects...</span>
          </>
        ) : (
          <SelectValue placeholder="Select a project..." />
        )}
      </SelectTrigger>
      <SelectContent>
        {/* All Projects option */}
        <SelectItem value="all">
          <span className="font-medium">All Projects</span>
          {availableProjects.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">({availableProjects.length})</span>
          )}
        </SelectItem>

        {/* Individual projects */}
        {availableProjects.map((project: CompanyProject) => (
          <SelectItem
            key={project.companyProjectId}
            value={project.companyProjectId.toString()}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{project.displayName}</span>
              <span className="text-xs text-muted-foreground">({project.customerId})</span>
            </div>
          </SelectItem>
        ))}

        {/* No projects available */}
        {availableProjects.length === 0 && !isLoading && (
          <SelectItem value="none" disabled>
            <span className="text-muted-foreground">No projects available</span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
