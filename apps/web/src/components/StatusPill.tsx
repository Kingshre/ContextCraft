import { Badge } from '@/components/ui/badge';
import type { ApiStatus } from '@/types/api';

interface StatusPillProps {
  status: ApiStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return { label: 'API Connected', className: 'status-success' };
      case 'error':
        return { label: 'API Error', className: 'status-error' };
      case 'loading':
        return { label: 'Processing...', className: 'status-idle animate-pulse-subtle' };
      default:
        return { label: 'Ready', className: 'status-idle' };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant="status" className={config.className}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'success' ? 'bg-success' : 
        status === 'error' ? 'bg-destructive' : 
        'bg-muted-foreground'
      }`} />
      {config.label}
    </Badge>
  );
}
