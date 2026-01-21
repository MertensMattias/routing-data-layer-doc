import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

interface Step4SuccessProps {
  segmentTypeName: string;
  onClose: () => void;
}

export function Step4Success({ segmentTypeName, onClose }: Step4SuccessProps) {
  return (
    <div className="space-y-6 py-4">
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-900">
          <div className="font-semibold text-lg mb-2">Segment Type Created Successfully!</div>
          <p>
            Your segment type <span className="font-mono font-semibold">{segmentTypeName}</span> has been
            created with all configured keys. It's now available for use in routing flows.
          </p>
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <h4 className="font-medium">Next Steps</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Use this segment type when creating new routing segments</li>
          <li>Configure segment-specific key values for each instance</li>
          <li>Edit keys or basic info using the segment type editor</li>
          <li>View usage statistics to see where this type is used</li>
        </ul>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
