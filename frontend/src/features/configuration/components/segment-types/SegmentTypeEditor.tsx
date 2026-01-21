import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BasicInfoTab } from './editor/BasicInfoTab';
import { KeyManagementTab } from './editor/KeyManagementTab';
import { UsageTab } from './editor/UsageTab';
import type { SegmentType } from '@/api/types';
import { getSegmentType } from '@/services/configuration';

interface SegmentTypeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentType: SegmentType;
  onSuccess: () => void;
}

export function SegmentTypeEditor({
  open,
  onOpenChange,
  segmentType: initialSegmentType,
  onSuccess,
}: SegmentTypeEditorProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [segmentType, setSegmentType] = useState(initialSegmentType);

  // Reload segment type data when dialog opens
  useEffect(() => {
    if (!open || !initialSegmentType.segmentTypeName) return;

    const loadSegmentType = async () => {
      try {
        const data = await getSegmentType(initialSegmentType.segmentTypeName, true);
        setSegmentType(data);
      } catch (err) {
        console.error('Failed to reload segment type:', err);
      }
    };

    loadSegmentType();
  }, [open, initialSegmentType.segmentTypeName]);

  const loadSegmentType = async () => {
    if (!initialSegmentType.segmentTypeName) {
      console.error('Segment type name is missing:', initialSegmentType);
      return;
    }

    try {
      const data = await getSegmentType(initialSegmentType.segmentTypeName, true);
      setSegmentType(data);
    } catch (err) {
      console.error('Failed to reload segment type:', err);
    }
  };

  const handleSuccess = () => {
    loadSegmentType();
    onSuccess();
  };

  // Get display name for title
  const displayTypeName = segmentType.segmentTypeName || 'Unknown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Segment Type: {displayTypeName}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="keys">Keys ({segmentType.keys?.length || 0})</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <BasicInfoTab
              segmentType={segmentType}
              onSuccess={handleSuccess}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <KeyManagementTab
              segmentType={segmentType}
              onSuccess={handleSuccess}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <UsageTab
              segmentType={segmentType}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
