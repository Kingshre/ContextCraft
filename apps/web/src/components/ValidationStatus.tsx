import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { Validation } from '@/types/api';

interface ValidationStatusProps {
  validation: Validation | null;
}

export function ValidationStatus({ validation }: ValidationStatusProps) {
  if (!validation) {
    return (
      <div className="panel p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Fidelity Validation
        </h3>
        <div className="text-sm text-muted-foreground">
          Run a transformation to see validation results.
        </div>
      </div>
    );
  }

  const isPassing = validation.fidelity_score === 1;
  const hasWarnings = validation.warnings && validation.warnings.length > 0;

  return (
    <div className="panel p-4">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Fidelity Validation
      </h3>

      <div className="space-y-3">
        <div className={`flex items-center gap-2 text-lg font-semibold ${
          isPassing ? 'text-success' : 'text-destructive'
        }`}>
          {isPassing ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Fidelity: Pass
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5" />
              Fidelity: Fail
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Score: {validation.fidelity_score}
        </div>

        {hasWarnings && (
          <div className="space-y-2 pt-2 border-t border-border">
            {validation.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-warning">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
