/**
 * SearchFilter - Search and filter controls for the flow canvas
 * 
 * Features:
 * - Text search by segment name/displayName
 * - Filter by segment type
 * - Filter by validation state
 */
import { useCallback, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useFlowStore, SearchFilter as SearchFilterType } from '@/features/flow-designer/stores/flow-store';

export const SearchFilter: React.FC = () => {
  const { flow, searchFilter, setSearchFilter, clearSearchFilter, getMatchingSegmentIds } = useFlowStore();

  // Get unique segment types from the flow
  const segmentTypes = useMemo(() => {
    if (!flow) return [];
    const types = new Set(flow.segments.map(s => s.segmentType));
    return Array.from(types).sort();
  }, [flow]);

  // Count matching segments
  const matchingCount = useMemo(() => {
    return getMatchingSegmentIds().size;
  }, [getMatchingSegmentIds, searchFilter]);

  const totalCount = flow?.segments.length ?? 0;

  // Check if any filter is active
  const hasActiveFilter = searchFilter.text || searchFilter.segmentType || searchFilter.validationState !== 'all';

  // Count active filters (excluding text search)
  const activeFilterCount = [
    searchFilter.segmentType,
    searchFilter.validationState !== 'all',
  ].filter(Boolean).length;

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter({ text: e.target.value });
  }, [setSearchFilter]);

  const handleTypeChange = useCallback((value: string) => {
    setSearchFilter({ segmentType: value === 'all' ? null : value });
  }, [setSearchFilter]);

  const handleValidationChange = useCallback((value: string) => {
    setSearchFilter({ validationState: value as SearchFilterType['validationState'] });
  }, [setSearchFilter]);

  const handleClear = useCallback(() => {
    clearSearchFilter();
  }, [clearSearchFilter]);

  if (!flow) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search segments..."
          value={searchFilter.text}
          onChange={handleTextChange}
          className="pl-8 w-48 h-8"
        />
        {searchFilter.text && (
          <button
            onClick={() => setSearchFilter({ text: '' })}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3 w-3" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <div className="font-medium text-sm">Filter Segments</div>
            
            {/* Segment type filter */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Segment Type</label>
              <Select
                value={searchFilter.segmentType ?? 'all'}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {segmentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Validation state filter */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Validation State</label>
              <Select
                value={searchFilter.validationState}
                onValueChange={handleValidationChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  <SelectItem value="error">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Errors
                    </span>
                  </SelectItem>
                  <SelectItem value="warning">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Warnings
                    </span>
                  </SelectItem>
                  <SelectItem value="ok">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Valid
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear filters button */}
            {(searchFilter.segmentType || searchFilter.validationState !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchFilter({ segmentType: null, validationState: 'all' })}
                className="w-full text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Match count indicator */}
      {hasActiveFilter && (
        <div className="text-xs text-gray-500">
          {matchingCount} / {totalCount} segments
          <button
            onClick={handleClear}
            className="ml-2 text-blue-500 hover:text-blue-700 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
