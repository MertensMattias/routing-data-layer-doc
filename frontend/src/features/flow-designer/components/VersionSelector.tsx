import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listChangeSets } from '@/services/changeset';
import { ChangeSetStatus } from '@/api/types';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';

interface VersionSelectorProps {
  routingId: string;
  onVersionChange: (changeSetId: string | null) => void;
}

/**
 * Version selector dropdown for switching between published and draft versions
 * Follows GLOBAL_UI_DESIGN patterns for Select components
 */
export function VersionSelector({ routingId, onVersionChange }: VersionSelectorProps) {
  const currentChangeSetId = useFlowStore((state) => state.flow?.changeSetId);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['changeset-versions', routingId],
    queryFn: () => listChangeSets(routingId),
    enabled: !!routingId,
  });

  if (isLoading) {
    return (
      <div className="w-[240px] h-9 flex items-center justify-center text-sm text-slate-500">
        Loading versions...
      </div>
    );
  }

  const published = versions?.filter((v) => v.status === ChangeSetStatus.PUBLISHED) || [];
  const drafts = versions?.filter((v) => v.status === ChangeSetStatus.DRAFT) || [];

  const displayValue = currentChangeSetId
    ? 'Draft'
    : 'Published';

  return (
    <Select
      value={currentChangeSetId || 'published'}
      onValueChange={(value) => onVersionChange(value === 'published' ? null : value)}
    >
      <SelectTrigger className="w-[240px]">
        <SelectValue>{displayValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Published</SelectLabel>
          <SelectItem value="published">
            📦 Published Version
          </SelectItem>
          {published.map((v) => (
            <SelectItem key={v.changeSetId} value={v.changeSetId}>
              📦 {new Date(v.dateCreated).toLocaleDateString()}
            </SelectItem>
          ))}
        </SelectGroup>

        {drafts.length > 0 && (
          <SelectGroup>
            <SelectLabel>Drafts</SelectLabel>
            {drafts.map((v) => (
              <SelectItem key={v.changeSetId} value={v.changeSetId}>
                ✏️ Draft - {new Date(v.dateCreated).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

