import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MarkdownEditor = ({ 
  value, 
  onChange, 
  placeholder = "# Your Presentation Title\n\n## Slide 1\n\nYour content here...\n\n---\n\n## Slide 2\n\nMore content...\n\n- Bullet point 1\n- Bullet point 2\n- Bullet point 3" 
}: MarkdownEditorProps) => {
  return (
    <Card className="h-full p-6 bg-gradient-secondary border-border/50">
      <div className="h-full flex flex-col space-y-4">
        <div className="space-y-2">
          <Label htmlFor="markdown-input" className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Markdown Content
          </Label>
          <p className="text-sm text-muted-foreground">
            Write your presentation content in Markdown format. Use <code className="px-1 py-0.5 bg-muted rounded text-xs">---</code> to separate slides.
          </p>
        </div>
        
        <Textarea
          id="markdown-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 resize-none font-mono text-sm leading-relaxed min-h-0 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
        />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value.length} characters</span>
          <span>{value.split('---').length} slides detected</span>
        </div>
      </div>
    </Card>
  );
};