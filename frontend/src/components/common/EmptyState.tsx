import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable empty state component
 * Used when there's no data to display (e.g., empty lists, no search results)
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          {Icon && (
            <Icon className="h-12 w-12 text-slate-400 mx-auto mb-4" aria-hidden="true" />
          )}
          <p className="text-slate-600 font-medium mb-2">{title}</p>
          {description && (
            <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">{description}</p>
          )}
          {action && (
            <Button
              variant="default"
              onClick={action.onClick}
              aria-label={action.label}
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
