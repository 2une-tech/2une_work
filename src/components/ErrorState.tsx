import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function ErrorState(props: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const { title = 'Something went wrong', description = 'Please try again.', onRetry } = props;
  return (
    <EmptyState
      icon={<AlertTriangle className="h-6 w-6" />}
      title={title}
      description={description}
      actions={
        onRetry
          ? [
              {
                label: 'Retry',
                onClick: onRetry,
                variant: 'outline',
              },
            ]
          : undefined
      }
      className="py-10"
    />
  );
}

