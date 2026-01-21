'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileHandlerService } from '@/services/shared';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onFileSelected: (file: File, overwrite: boolean) => void;
  isLoading?: boolean;
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  onFileSelected,
  isLoading = false,
}: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError('');

    // Validate file size
    const sizeMB = FileHandlerService.getFileSizeInMB(file);
    if (sizeMB > 50) {
      setFileError('File is too large (max 50 MB)');
      return;
    }

    // Validate JSON
    const isValid = await FileHandlerService.validateJsonFile(file);
    if (!isValid) {
      setFileError('File is not valid JSON');
      return;
    }

    setSelectedFile(file);
  }

  function handleImport() {
    if (!selectedFile) {
      setFileError('Please select a file');
      return;
    }

    onFileSelected(selectedFile, overwrite);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Import {title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-slate-700 font-medium">Select File</Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
            {selectedFile && (
              <p className="text-sm text-slate-600">
                Selected: <span className="font-medium">{selectedFile.name}</span> ({FileHandlerService.getFileSizeInMB(selectedFile).toFixed(2)} MB)
              </p>
            )}
          </div>

          {fileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="overwrite" className="text-slate-700 cursor-pointer">Overwrite existing {title.toLowerCase()}</Label>
          </div>

          {overwrite && (
            <Alert className="border-indigo-200 bg-indigo-50">
              <AlertCircle className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-slate-700">
                This will update existing entries. You will be able to review changes before confirming.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="border-slate-300 hover:bg-slate-50 min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || isLoading} className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
            {isLoading ? 'Loading Preview...' : 'Next (Preview)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
