import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Toaster } from 'sonner';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { useFlowQuery } from '@/features/flow-designer/hooks/useFlowQuery';
import { useUnsavedChangesWarning } from '@/features/flow-designer/hooks/useUnsavedChangesWarning';
import { useKeyboardShortcuts } from '@/features/flow-designer/hooks/useKeyboardShortcuts';
import { FlowToolbar } from '@/features/flow-designer/components/toolbar/FlowToolbar';
import { FlowCanvas } from '@/features/flow-designer/components/canvas/FlowCanvas';
import { PropertiesPanel } from '@/features/flow-designer/components/properties/PropertiesPanel';
import { RoutingConfigurationPanel } from '@/features/flow-designer/components/properties/RoutingConfigurationPanel';
import { ValidationPanel } from '@/features/flow-designer/components/validation/ValidationPanel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/**
 * Main Flow Designer page with full integration
 */
export const FlowDesignerPage: React.FC = () => {
  const { routingId, changeSetId } = useParams<{ routingId: string; changeSetId?: string }>();
  const { loadFlow, clearFlow, selectedSegmentId } = useFlowStore();

  // Load flow from API
  const { data: flow, isLoading, error, refetch } = useFlowQuery(
    { flowId: routingId!, version: changeSetId },
    !!routingId
  );

  // Setup hooks
  useUnsavedChangesWarning();
  useKeyboardShortcuts();

  // Update store when flow loads
  useEffect(() => {
    if (flow) {
      loadFlow(flow);
    }
  }, [flow, loadFlow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFlow();
    };
  }, [clearFlow]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" message="Loading flow..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600 mb-2">Error loading flow</div>
          <p className="text-sm text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Toolbar */}
        <FlowToolbar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <FlowCanvas />
            </ReactFlowProvider>
          </div>

          {/* Properties Panel (Right Sidebar) - Auto-hide when no selection */}
          {selectedSegmentId && (
            <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
              {selectedSegmentId === '__START__' ? (
                <RoutingConfigurationPanel />
              ) : (
                <PropertiesPanel />
              )}
            </div>
          )}
        </div>

        {/* Validation Panel (Bottom Drawer) */}
        <ValidationPanel />

        {/* Toast Notifications */}
        <Toaster position="bottom-right" />
      </div>
    </ErrorBoundary>
  );
};
