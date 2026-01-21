'use client';

import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SegmentSnapshot } from '@/api/types';

interface SegmentOrderPanelProps {
  segments: SegmentSnapshot[];
  onReorder: (reorderedSegments: SegmentSnapshot[]) => void;
  onAutoOrder: () => void;
  isLoading?: boolean;
}

export function SegmentOrderPanel({
  segments,
  onReorder,
  onAutoOrder,
  isLoading = false,
}: SegmentOrderPanelProps) {
  // Use segments prop directly - no local state duplication
  // If parent needs to control state, it should manage it externally

  function moveSegment(index: number, direction: 'up' | 'down') {
    const newSegments = [...segments];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newSegments.length) return;

    [newSegments[index], newSegments[newIndex]] = [newSegments[newIndex], newSegments[index]];

    // Update order numbers
    newSegments.forEach((seg, idx) => {
      seg.segmentOrder = idx + 1;
    });

    // Notify parent of reorder - parent should update state
    onReorder(newSegments);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Segment Order</CardTitle>
            <CardDescription>Drag or use arrows to reorder segments for visual layout</CardDescription>
          </div>
          <Button
            onClick={onAutoOrder}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Auto-Order by Flow
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {segments.map((segment, idx) => (
            <div
              key={segment.segmentName}
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{segment.displayName || segment.segmentName}</p>
                <p className="text-xs text-muted-foreground">{segment.segmentType}</p>
              </div>

              <div className="flex gap-1">
                <Button
                  onClick={() => moveSegment(idx, 'up')}
                  disabled={idx === 0 || isLoading}
                  variant="ghost"
                  size="sm"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => moveSegment(idx, 'down')}
                  disabled={idx === segments.length - 1 || isLoading}
                  variant="ghost"
                  size="sm"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              <span className="text-xs text-muted-foreground w-6 text-right">
                {segment.segmentOrder || idx + 1}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
