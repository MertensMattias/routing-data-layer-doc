import { useState } from 'react';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ChangeSetFilterValue = 'all' | 'published' | 'draft';

interface ChangeSetFilterProps {
  value: ChangeSetFilterValue;
  onChange: (value: ChangeSetFilterValue) => void;
  className?: string;
  showLabel?: boolean;
}

/**
 * Filter component for ChangeSet state (Published/Draft/All)
 * Used in list views to filter flows, segments, or messages by their publish state
 */
export function ChangeSetFilter({
  value,
  onChange,
  className = '',
  showLabel = true,
}: ChangeSetFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Status:</span>
        </div>
      )}
      <Select value={value} onValueChange={(val) => onChange(val as ChangeSetFilterValue)}>
        <SelectTrigger className="w-[140px] border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="published">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Published
            </div>
          </SelectItem>
          <SelectItem value="draft">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Draft
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Hook to filter items by ChangeSet status
 */
export function useChangeSetFilter<T extends { changeSetId?: string | null }>(items: T[]) {
  const [filter, setFilter] = useState<ChangeSetFilterValue>('all');

  const filteredItems = items.filter((item) => {
    if (filter === 'published') {
      return !item.changeSetId;
    }
    if (filter === 'draft') {
      return !!item.changeSetId;
    }
    return true; // 'all'
  });

  return {
    filter,
    setFilter,
    filteredItems,
    counts: {
      all: items.length,
      published: items.filter((i) => !i.changeSetId).length,
      draft: items.filter((i) => !!i.changeSetId).length,
    },
  };
}
