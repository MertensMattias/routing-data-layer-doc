import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { SegmentType } from '@/api/types';
import { listSegmentTypes } from '@/services/configuration';

interface SegmentTypeListProps {
  selectedTypeId?: number;
  onTypeSelect: (type: SegmentType) => void;
}

export function SegmentTypeList({ selectedTypeId, onTypeSelect }: SegmentTypeListProps) {
  const { data: types = [], isLoading, error } = useQuery<SegmentType[]>({
    queryKey: ['segmentTypes'],
    queryFn: async () => {
      // Use the configuration service which properly handles the response
      const segmentTypes = await listSegmentTypes(false);

      // Debug: Log response structure
      if (import.meta.env.DEV) {
        console.log('[SegmentTypeList] Received segment types:', segmentTypes.length);
        if (segmentTypes.length > 0) {
          console.log('[SegmentTypeList] First segment type:', segmentTypes[0]);
          console.log('[SegmentTypeList] Type of first item:', typeof segmentTypes[0]);
          console.log('[SegmentTypeList] Has dicSegmentTypeId:', segmentTypes[0] && typeof segmentTypes[0] === 'object' && 'dicSegmentTypeId' in segmentTypes[0]);
          // Check for any invalid types
          const invalidTypes = segmentTypes.filter(
            (t) => !t || typeof t !== 'object' || !t.dicSegmentTypeId || !t.segmentTypeName
          );
          if (invalidTypes.length > 0) {
            console.error('[SegmentTypeList] Invalid types received from service:', invalidTypes);
          }
        }
      }

      return segmentTypes;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load segment types. Please try again.
      </div>
    );
  }

  // Additional defensive filtering - filter out any invalid types that somehow got through
  // This is a safety net in case cached data or other issues cause invalid types to reach the component
  const invalidTypes: Array<{ type: any; reason: string }> = [];
  const validTypes = types.filter((type) => {
    // Ensure type is an object (not a string or other primitive)
    if (!type || typeof type !== 'object' || Array.isArray(type)) {
      invalidTypes.push({ type, reason: `non-object (${typeof type})` });
      return false;
    }
    // Ensure required fields are present
    const hasId = type.dicSegmentTypeId != null && typeof type.dicSegmentTypeId === 'number';
    const hasName = type.segmentTypeName != null && typeof type.segmentTypeName === 'string' && type.segmentTypeName.trim().length > 0;
    if (!hasId || !hasName) {
      invalidTypes.push({
        type,
        reason: `missing required fields (dicSegmentTypeId: ${type.dicSegmentTypeId}, segmentTypeName: ${type.segmentTypeName})`,
      });
      return false;
    }
    return true;
  });

  // Log summary of filtered items (only if there are any, to reduce console noise)
  if (import.meta.env.DEV && invalidTypes.length > 0) {
    console.warn(
      `[SegmentTypeList] Filtered out ${invalidTypes.length} invalid types (should be filtered by service layer):`,
      invalidTypes.map(({ type, reason }) => `${type} (${reason})`).join(', ')
    );
  }

  // Group types by category (types should already be properly formatted from listSegmentTypes)
  const groupedTypes = validTypes.reduce((acc, type) => {
    const category = type.category ? String(type.category) : 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(type);
    return acc;
  }, {} as Record<string, SegmentType[]>);

  return (
    <div>
      <div className="p-4 border-b border-slate-200 bg-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Segment Types</h3>
        <p className="text-xs text-slate-500 mt-1">Select a type to configure</p>
      </div>
      <div className="p-3 space-y-4">
        {Object.entries(groupedTypes).map(([category, categoryTypes]) => (
          <div key={category}>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 px-1">
              {category}
            </div>
            <div className="space-y-1">
              {categoryTypes
                .map((type) => {
                // Safely extract all fields with proper type checking
                const dicSegmentTypeId = type.dicSegmentTypeId;
                const displayName = type.displayName?.trim() || '';
                const segmentTypeName = type.segmentTypeName?.trim() || '';
                const isSelected = selectedTypeId === dicSegmentTypeId;

                // Determine primary name with proper fallbacks
                // Priority: displayName > segmentTypeName > ID-based fallback
                // Note: Invalid types should be filtered above, but this is a final safety net
                let primaryName = displayName || segmentTypeName;
                if (!primaryName) {
                  // Last resort: use ID if available, otherwise skip (shouldn't happen due to filtering above)
                  if (dicSegmentTypeId != null && typeof dicSegmentTypeId === 'number') {
                    primaryName = `Type ${dicSegmentTypeId}`;
                  } else {
                    // This should never happen due to filtering above, but log if it does
                    if (import.meta.env.DEV) {
                      console.error('[SegmentTypeList] Invalid segment type reached render (should have been filtered):', {
                        dicSegmentTypeId,
                        segmentTypeName,
                        displayName,
                        fullType: type,
                      });
                    }
                    // Skip rendering this invalid type by returning null
                    return null as unknown as JSX.Element;
                  }
                }

                // Secondary name (only show if different from primary)
                const secondaryName = segmentTypeName && segmentTypeName !== primaryName
                  ? segmentTypeName
                  : (displayName && displayName !== primaryName ? displayName : '');

                // Get initials for icon (first 2 characters of primary name)
                const initials = primaryName.length >= 2
                  ? primaryName.substring(0, 2).toUpperCase()
                  : primaryName.toUpperCase() || '??';

                // Use dicSegmentTypeId as key, fallback to index if missing
                const buttonKey = dicSegmentTypeId != null ? dicSegmentTypeId : `type-${categoryTypes.indexOf(type)}`;

                return (
                  <button
                    key={buttonKey}
                    onClick={() => onTypeSelect(type)}
                    className={`group relative w-full text-left rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-indigo-400 shadow-md p-3'
                        : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm p-2'
                    }`}
                  >
                    {/* Compact view for unselected */}
                    {!isSelected ? (
                      <div className="flex items-center gap-2">
                        {/* Small icon */}
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center font-bold text-xs text-slate-600 group-hover:text-indigo-600">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-900 group-hover:text-indigo-900 truncate">
                            {primaryName}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Expanded view for selected */
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-lg"></div>
                        <div className="flex items-start gap-3">
                          {/* Icon/Badge */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm bg-indigo-500 text-white shadow-sm">
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm mb-1 text-indigo-900">
                              {primaryName}
                            </div>
                            {secondaryName && secondaryName !== primaryName && (
                              <div className="text-xs text-slate-500 font-mono mb-1.5">{secondaryName}</div>
                            )}
                            {type.description && (
                              <div className="text-xs text-slate-600 leading-relaxed">
                                {type.description}
                              </div>
                            )}
                          </div>

                          {/* Check indicator */}
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </>
                    )}
                  </button>
                );
              })
                .filter((element): element is JSX.Element => element !== null)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

