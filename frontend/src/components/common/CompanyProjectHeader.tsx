'use client';

import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { CompanyProjectSelector } from './CompanyProjectSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useState } from 'react';

interface CompanyProjectHeaderProps {
  className?: string;
}

/**
 * CompanyProjectHeader (Refactored v3.3.1 - Compact)
 *
 * Ultra-compact header component with split layout:
 * - Left: Company project selector dropdown
 * - Right: Status badge + Customer ID + Details toggle
 * - Expandable: Collapsible project details panel
 *
 * Reduces vertical space from ~200-300px to ~40-48px (collapsed)
 * Space-efficient design for better content visibility
 */
export function CompanyProjectHeader({ className }: CompanyProjectHeaderProps) {
  const { selectedCompanyProjectId, error, getCurrentProject } = useCompanyProjectContext();

  const currentProject = getCurrentProject();

  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={cn('border-b bg-card', className)}>
      {/* Error Message - Compact */}
      {error && (
        <div className="flex gap-2 border-b bg-destructive/5 px-6 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">{error}</p>
        </div>
      )}

      {/* Main Header - Single compact row */}
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        {/* Left: Project Selector */}
        <div className="flex-1 max-w-md">
          <CompanyProjectSelector size="sm" />
        </div>

        {/* Right: Status + Customer ID + Details Toggle */}
        {currentProject && selectedCompanyProjectId && (
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <Badge
              variant={currentProject.isActive ? 'default' : 'secondary'}
              className="text-xs whitespace-nowrap"
            >
              {currentProject.isActive ? 'Active' : 'Inactive'}
            </Badge>

            {/* Customer ID */}
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {currentProject.customerId}
            </span>

            {/* Details Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 gap-1 px-2"
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              <ChevronDown
                className={cn('size-4 transition-transform duration-200', showDetails && 'rotate-180')}
              />
              <span className="hidden sm:inline text-xs">Details</span>
            </Button>
          </div>
        )}
      </div>

      {/* Expandable Details Panel */}
      {showDetails && currentProject && selectedCompanyProjectId && (
        <div className="border-t bg-muted/50 px-6 py-3">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {/* Project Name */}
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Project Name</dt>
              <dd className="mt-0.5 font-medium">{currentProject.displayName}</dd>
            </div>

            {/* Project ID */}
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Project ID</dt>
              <dd className="mt-0.5 font-mono text-xs">{currentProject.projectId}</dd>
            </div>

            {/* Description (if present) */}
            {currentProject.description && (
              <div className="col-span-1 sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                <dd className="mt-0.5 text-sm">{currentProject.description}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

