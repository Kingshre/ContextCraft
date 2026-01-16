import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';
import type { Profile, Strength } from '@/types/api';

const DEFAULT_SAMPLE = `yeah we crushed it lol, revenue up 25% in 2024!!`;

interface InputPanelProps {
  markdown: string;
  profile: Profile;
  strength: Strength;
  isLoading: boolean;
  onMarkdownChange: (value: string) => void;
  onProfileChange: (value: Profile) => void;
  onStrengthChange: (value: Strength) => void;
  onTransform: () => void;
  onReset: () => void;
}

export function InputPanel({
  markdown,
  profile,
  strength,
  isLoading,
  onMarkdownChange,
  onProfileChange,
  onStrengthChange,
  onTransform,
  onReset,
}: InputPanelProps) {
  return (
    <div className="panel p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <Label htmlFor="input" className="text-sm font-medium text-foreground">
          Input document (Markdown)
        </Label>
        <span className="text-xs text-muted-foreground">
          Numbers/dates/names must remain unchanged
        </span>
      </div>

      <Textarea
        id="input"
        value={markdown}
        onChange={(e) => onMarkdownChange(e.target.value)}
        placeholder="Enter your markdown content..."
        className="flex-1 min-h-[200px] resize-none font-mono text-sm bg-muted/50 border-border focus:border-primary/50"
      />

      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profile" className="text-xs text-muted-foreground uppercase tracking-wider">
              Profile
            </Label>
            <Select value={profile} onValueChange={(v) => onProfileChange(v as Profile)}>
              <SelectTrigger id="profile" className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strength" className="text-xs text-muted-foreground uppercase tracking-wider">
              Strength
            </Label>
            <Select value={strength} onValueChange={(v) => onStrengthChange(v as Strength)}>
              <SelectTrigger id="strength" className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="transform"
            className="flex-1"
            onClick={onTransform}
            disabled={isLoading || !markdown.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin-slow" />
                Transforming...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Transform
              </>
            )}
          </Button>
          <Button variant="reset" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_SAMPLE };
