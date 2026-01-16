import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiffView } from '@/components/DiffView';
import { ChangeLog } from '@/components/ChangeLog';
import { ValidationStatus } from '@/components/ValidationStatus';
import { FileText, GitCompare, List } from 'lucide-react';
import type { TransformResponse } from '@/types/api';

interface OutputPanelProps {
  response: TransformResponse | null;
}

export function OutputPanel({ response }: OutputPanelProps) {
  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="rewritten" className="flex flex-col h-full">
        <div className="border-b border-border px-2">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="rewritten" className="data-[state=active]:bg-muted gap-2">
              <FileText className="w-4 h-4" />
              Rewritten
            </TabsTrigger>
            <TabsTrigger value="diff" className="data-[state=active]:bg-muted gap-2">
              <GitCompare className="w-4 h-4" />
              Diff
            </TabsTrigger>
            <TabsTrigger value="changelog" className="data-[state=active]:bg-muted gap-2">
              <List className="w-4 h-4" />
              Change Log
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <TabsContent value="rewritten" className="flex-1 m-0 overflow-auto data-[state=inactive]:hidden">
            {response?.transformed_markdown ? (
              <div className="p-5">
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                  {response.transformed_markdown}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No output yet. Run a transformation to see results.
              </div>
            )}
          </TabsContent>

          <TabsContent value="diff" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
            <DiffView diff={response?.diff || ''} />
          </TabsContent>

          <TabsContent value="changelog" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
            <ChangeLog changes={response?.changes || []} />
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t border-border">
        <ValidationStatus validation={response?.validation || null} />
      </div>
    </div>
  );
}
