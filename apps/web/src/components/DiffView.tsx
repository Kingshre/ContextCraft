import { useMemo } from 'react';

interface DiffViewProps {
  diff: string;
}

export function DiffView({ diff }: DiffViewProps) {
  const lines = useMemo(() => {
    if (!diff) return [];
    return diff.split('\n').map((line, index) => {
      const isAdd = line.startsWith('+') && !line.startsWith('+++');
      const isRemove = line.startsWith('-') && !line.startsWith('---');
      const isHeader = line.startsWith('@@') || line.startsWith('+++') || line.startsWith('---');
      
      return {
        content: line,
        type: isAdd ? 'add' : isRemove ? 'remove' : isHeader ? 'header' : 'context',
        lineNumber: index + 1,
      };
    });
  }, [diff]);

  if (!diff) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No diff available yet. Run a transformation to see changes.
      </div>
    );
  }

  return (
    <div className="font-mono text-sm overflow-auto h-full">
      <pre className="p-4 space-y-0.5">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`px-2 py-0.5 rounded-sm ${
              line.type === 'add' ? 'diff-add' : 
              line.type === 'remove' ? 'diff-remove' : 
              line.type === 'header' ? 'text-muted-foreground bg-muted/50' :
              'text-foreground'
            }`}
          >
            {line.content || '\u00A0'}
          </div>
        ))}
      </pre>
    </div>
  );
}
