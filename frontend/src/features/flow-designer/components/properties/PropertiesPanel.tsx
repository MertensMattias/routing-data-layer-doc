import { useState } from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { SegmentMetadata } from './SegmentMetadata';
import { ConfigEditor } from './ConfigEditor';
import { TransitionEditor } from './TransitionEditor';
import { HooksEditor } from './HooksEditor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, FileText, ChevronDown } from 'lucide-react';

// localStorage keys for persisting collapse state
const STORAGE_KEYS = {
  metadata: 'flowDesigner.panel.metadata.collapsed',
  config: 'flowDesigner.panel.config.collapsed',
  transitions: 'flowDesigner.panel.transitions.collapsed',
  hooks: 'flowDesigner.panel.hooks.collapsed',
};

/**
 * Hook for managing collapse state with localStorage persistence
 */
function useCollapseState(key: string, defaultOpen: boolean): [boolean, (open: boolean) => void] {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === 'true' : defaultOpen;
  });

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem(key, String(open));
  };

  return [isOpen, handleToggle];
}

/**
 * Collapsible section wrapper component
 */
interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isOpen, onOpenChange, children }: CollapsibleSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-gray-50 rounded-lg transition-colors">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Properties panel for editing selected segment
 */
export const PropertiesPanel: React.FC = () => {
  const { setSelectedSegment, getSelectedSegment } = useFlowStore();
  const selectedSegment = getSelectedSegment();

  // Collapse states with localStorage persistence
  const [metadataOpen, setMetadataOpen] = useCollapseState(STORAGE_KEYS.metadata, true);
  const [configOpen, setConfigOpen] = useCollapseState(STORAGE_KEYS.config, true);
  const [transitionsOpen, setTransitionsOpen] = useCollapseState(STORAGE_KEYS.transitions, false);
  const [hooksOpen, setHooksOpen] = useCollapseState(STORAGE_KEYS.hooks, false);

  if (!selectedSegment) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No segment selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a segment from the canvas to view and edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Segment Properties</h2>
        <button
          onClick={() => setSelectedSegment(null)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close properties panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 px-6">
          {/* Metadata Section */}
          <CollapsibleSection
            title="Metadata"
            isOpen={metadataOpen}
            onOpenChange={setMetadataOpen}
          >
            <SegmentMetadata segment={selectedSegment as any} />
          </CollapsibleSection>

          {/* Configuration Section */}
          <CollapsibleSection
            title="Configuration"
            isOpen={configOpen}
            onOpenChange={setConfigOpen}
          >
            <ConfigEditor segment={selectedSegment as any} />
          </CollapsibleSection>

          {/* Transitions Section */}
          <CollapsibleSection
            title="Transitions"
            isOpen={transitionsOpen}
            onOpenChange={setTransitionsOpen}
          >
            <TransitionEditor segment={selectedSegment as any} />
          </CollapsibleSection>

          {/* Hooks Section */}
          <CollapsibleSection
            title="Hooks"
            isOpen={hooksOpen}
            onOpenChange={setHooksOpen}
          >
            <HooksEditor segment={selectedSegment as any} />
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};

