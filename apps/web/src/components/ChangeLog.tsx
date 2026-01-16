import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Change } from '@/types/api';

interface ChangeLogProps {
  changes: Change[];
}

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

function ExpandableText({ text, maxLength = 80 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;
  
  if (!needsTruncation) {
    return <span className="font-mono text-xs">{text}</span>;
  }

  return (
    <div className="space-y-1">
      <span className="font-mono text-xs">
        {expanded ? text : `${text.slice(0, maxLength)}...`}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3 h-3" /> Less
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" /> More
          </>
        )}
      </button>
    </div>
  );
}

export function ChangeLog({ changes }: ChangeLogProps) {
  const [showOnlyModified, setShowOnlyModified] = useState(false);

  const filteredChanges = showOnlyModified
    ? changes.filter((c) => c.change_type === 'modify')
    : changes;

  const modifyCount = changes.filter((c) => c.change_type === 'modify').length;

  if (!changes.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No changes recorded yet. Run a transformation to see the change log.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="text-sm text-muted-foreground">
          {modifyCount} modification{modifyCount !== 1 ? 's' : ''} / {changes.length} total
        </span>
        <div className="flex items-center gap-2">
          <Switch
            id="filter-modified"
            checked={showOnlyModified}
            onCheckedChange={setShowOnlyModified}
          />
          <Label htmlFor="filter-modified" className="text-sm text-muted-foreground cursor-pointer">
            Show only modifications
          </Label>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-border">
          {filteredChanges.map((change, idx) => (
            <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-2 min-w-[120px]">
                  <Badge variant={change.change_type === 'modify' ? 'modify' : 'unchanged'}>
                    {change.change_type}
                  </Badge>
                  {change.rule_id && (
                    <Badge variant="rule" className="text-[10px]">
                      {change.rule_id}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Original</span>
                      <div className="p-2 bg-muted/50 rounded border border-border">
                        <ExpandableText text={change.original || '—'} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Transformed</span>
                      <div className="p-2 bg-muted/50 rounded border border-border">
                        <ExpandableText text={change.transformed || '—'} />
                      </div>
                    </div>
                  </div>

                  {change.reason && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Reason:</span> {change.reason}
                    </div>
                  )}

                  {change.warnings && change.warnings.length > 0 && (
                    <div className="flex items-start gap-2 text-warning text-sm">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{change.warnings.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
