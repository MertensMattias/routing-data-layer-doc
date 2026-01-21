import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * Reusable error state component with retry action
 * Follows design system: red-50 background, red-700 text, red-200 border
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
  showIcon = true,
}: ErrorStateProps) {
  return (
    <Card className={`border-red-200 ${className}`}>
      <CardContent className="pt-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <div className="flex items-start gap-3">
            {showIcon && (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-1">{title}</p>
              <p className="text-xs">{message}</p>
              {onRetry && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="border-red-300 text-red-700 hover:bg-red-100 transition-colors"
                    aria-label={retryLabel}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    {retryLabel}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
