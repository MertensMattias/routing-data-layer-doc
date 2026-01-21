/**
 * RoutingSelector - Select routing entries within the same project
 * 
 * Features:
 * - Shows all routing entries for the current project
 * - Includes unsaved changes dialog before switching
 * - Supports Save & Switch, Discard, and Cancel actions
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { listRoutingEntries } from '@/services/routing';

interface RoutingSelectorProps {
  currentRoutingId: string;
  companyProjectId: number;
}

/**
 * Selector for switching between routing entries within the same project.
 * Includes unsaved changes check before switching.
 */
export function RoutingSelector({ currentRoutingId, companyProjectId }: RoutingSelectorProps) {
  const navigate = useNavigate();
  const { hasUnsavedChanges, saveFlow, clearFlow } = useFlowStore();
  const [pendingRoutingId, setPendingRoutingId] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all routing entries for this project
  const { data: routingEntries = [], isLoading } = useQuery({
    queryKey: ['routing-entries-for-project', companyProjectId],
    queryFn: () => listRoutingEntries(undefined, companyProjectId),
    enabled: !!companyProjectId,
    staleTime: 60000,
  });

  // Only show selector if multiple routing entries exist
  if (routingEntries.length <= 1) {
    return null;
  }

  const handleRoutingChange = (newRoutingId: string) => {
    if (newRoutingId === currentRoutingId) return;

    if (hasUnsavedChanges()) {
      setPendingRoutingId(newRoutingId);
      setShowUnsavedDialog(true);
    } else {
      navigateToRouting(newRoutingId);
    }
  };

  const navigateToRouting = (routingId: string) => {
    clearFlow(); // Clear old flow to prevent flash
    navigate(`/designer/${routingId}`);
  };

  const handleDiscardAndSwitch = () => {
    if (pendingRoutingId) {
      navigateToRouting(pendingRoutingId);
    }
    setShowUnsavedDialog(false);
    setPendingRoutingId(null);
  };

  const handleSaveAndSwitch = async () => {
    setIsSaving(true);
    try {
      await saveFlow();
      toast.success('Changes saved successfully');
      if (pendingRoutingId) {
        navigateToRouting(pendingRoutingId);
      }
    } catch (error) {
      toast.error('Failed to save changes');
      // Don't switch if save failed
      setShowUnsavedDialog(false);
      setPendingRoutingId(null);
      return;
    } finally {
      setIsSaving(false);
      setShowUnsavedDialog(false);
      setPendingRoutingId(null);
    }
  };

  const handleCancelSwitch = () => {
    setShowUnsavedDialog(false);
    setPendingRoutingId(null);
  };

  return (
    <>
      <Select
        value={currentRoutingId}
        onValueChange={handleRoutingChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Select routing..." />
        </SelectTrigger>
        <SelectContent>
          {routingEntries.map((entry) => (
            <SelectItem key={entry.routingId} value={entry.routingId}>
              <div className="flex items-center gap-2">
                <span className={entry.isActive ? 'font-medium' : 'text-muted-foreground'}>
                  {entry.sourceId || entry.routingId}
                </span>
                {!entry.isActive && (
                  <span className="text-xs text-muted-foreground">(inactive)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the current flow. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSwitch} disabled={isSaving}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDiscardAndSwitch}
              disabled={isSaving}
            >
              Discard Changes
            </Button>
            <AlertDialogAction onClick={handleSaveAndSwitch} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Switch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
