import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import type { ChangeSet } from '@/api/types';

interface DraftSwitcherProps {
  drafts: ChangeSet[];
  currentChangeSetId?: string;
  onChangeSetSelect: (changeSetId?: string) => void;
  onCreateDraft: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Reusable draft switcher component for managing draft versions
 */
export function DraftSwitcher({
  drafts,
  currentChangeSetId,
  onChangeSetSelect,
  onCreateDraft,
  isLoading,
  className,
}: DraftSwitcherProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Select
        value={currentChangeSetId || 'published'}
        onValueChange={(value) => 
          onChangeSetSelect(value === 'published' ? undefined : value)
        }
        disabled={isLoading}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select version" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="published">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Published</Badge>
              <span>Live Version</span>
            </div>
          </SelectItem>
          
          {drafts.length > 0 && <SelectSeparator />}
          
          {drafts.map((draft) => (
            <SelectItem key={draft.changeSetId} value={draft.changeSetId}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-600 text-white">Draft</Badge>
                  <span className="font-medium">
                    {draft.description || draft.changeSetId.slice(0, 8)}
                  </span>
                </div>
                {draft.createdBy && (
                  <span className="text-xs text-muted-foreground ml-14">
                    by {draft.createdBy} • {new Date(draft.dateCreated).toLocaleDateString()}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={onCreateDraft}
        disabled={isLoading}
        size="sm"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-1" />
        New Draft
      </Button>
    </div>
  );
}
