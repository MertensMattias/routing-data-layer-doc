import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Step1BasicInfo } from './wizard/Step1BasicInfo';
import { Step2DefineKeys } from './wizard/Step2DefineKeys';
import { Step3Review } from './wizard/Step3Review';
import { Step4Success } from './wizard/Step4Success';
import type { KeyConfig } from '@/api/types';
import { SegmentCategory } from '@/api/types';

interface SegmentTypeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export interface WizardFormData {
  segmentTypeName: string;
  displayName: string;
  description: string;
  category: SegmentCategory | undefined;
  isTerminal: boolean;
  isActive: boolean;
  keys: KeyConfig[];
}

// Type alias for backward compatibility
export type SegmentTypeWizardFormData = WizardFormData;

export function SegmentTypeWizard({ open, onOpenChange, onSuccess }: SegmentTypeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    segmentTypeName: '',
    displayName: '',
    description: '',
    category: undefined,
    isTerminal: false,
    isActive: true,
    keys: [],
  });

  const handleClose = () => {
    // Reset wizard on close
    setCurrentStep(1);
    setFormData({
      segmentTypeName: '',
      displayName: '',
      description: '',
      category: undefined,
      isTerminal: false,
      isActive: true,
      keys: [],
    });
    onOpenChange(false);
  };

  const handleStep1Next = (data: Partial<WizardFormData>) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(2);
  };

  const handleStep2Next = (keys: KeyConfig[]) => {
    setFormData({ ...formData, keys });
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStep3Submit = () => {
    setCurrentStep(4);
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Basic Information';
      case 2:
        return 'Define Keys';
      case 3:
        return 'Review & Create';
      case 4:
        return 'Success';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return 'Enter basic details for the segment type';
      case 2:
        return 'Configure keys for segment configuration';
      case 3:
        return 'Review your segment type before creating';
      case 4:
        return 'Segment type created successfully';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create Segment Type - Step {currentStep} of 4: {getStepTitle()}
          </DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        {currentStep === 1 && (
          <Step1BasicInfo formData={formData} onNext={handleStep1Next} onCancel={handleClose} />
        )}

        {currentStep === 2 && (
          <Step2DefineKeys
            formData={formData}
            onNext={handleStep2Next}
            onBack={handleStep2Back}
          />
        )}

        {currentStep === 3 && (
          <Step3Review
            formData={formData}
            onBack={handleStep3Back}
            onSubmit={handleStep3Submit}
          />
        )}

        {currentStep === 4 && (
          <Step4Success
            segmentTypeName={formData.segmentTypeName}
            onClose={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
