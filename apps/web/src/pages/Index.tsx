import { useState, useCallback, useEffect } from 'react';
import { StatusPill } from '@/components/StatusPill';
import { InputPanel, DEFAULT_SAMPLE } from '@/components/InputPanel';
import { OutputPanel } from '@/components/OutputPanel';
import { useTransform } from '@/hooks/useTransform';
import { useToast } from '@/hooks/use-toast';
import type { Profile, Strength } from '@/types/api';

const Index = () => {
  const [markdown, setMarkdown] = useState(DEFAULT_SAMPLE);
  const [profile, setProfile] = useState<Profile>('enterprise');
  const [strength, setStrength] = useState<Strength>('moderate');

  const { transform, response, status, error, clearError } = useTransform();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Transformation failed',
        description: error,
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleTransform = useCallback(() => {
    transform({ markdown, profile, strength });
  }, [transform, markdown, profile, strength]);

  const handleReset = useCallback(() => {
    setMarkdown(DEFAULT_SAMPLE);
    setProfile('enterprise');
    setStrength('moderate');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                ContextCraft
              </h1>
              <p className="text-sm text-muted-foreground">
                Audience-aware rewrites with fact-preservation + traceable diffs
              </p>
            </div>
            <StatusPill status={status} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          <InputPanel
            markdown={markdown}
            profile={profile}
            strength={strength}
            isLoading={status === 'loading'}
            onMarkdownChange={setMarkdown}
            onProfileChange={setProfile}
            onStrengthChange={setStrength}
            onTransform={handleTransform}
            onReset={handleReset}
          />
          <OutputPanel response={response} />
        </div>
      </main>
    </div>
  );
};

export default Index;
