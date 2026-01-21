import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

/**
 * Reusable loading spinner component
 * Uses indigo-500 for spinner and slate-600 for text (design system compliant)
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  className = '',
}) => {
  const sizeMap = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-500`} aria-label="Loading" />
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
};
