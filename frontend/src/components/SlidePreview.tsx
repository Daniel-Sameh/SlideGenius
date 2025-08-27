import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface SlidePreviewProps {
  htmlContent?: string;
  isGenerating?: boolean;
  onFullscreen?: () => void;
}

export const SlidePreview = ({ htmlContent, isGenerating, onFullscreen }: SlidePreviewProps) => {
  if (isGenerating) {
    return (
      <Card className="h-full bg-gradient-secondary border-border/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Generating your slides...</p>
            <p className="text-sm text-muted-foreground">AI is analyzing your content and selecting the perfect theme</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!htmlContent) {
    return (
      <Card className="h-full bg-gradient-secondary border-border/50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6M9 13h6M9 17h4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Your slides will appear here</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add your markdown content and click "Generate Slides" to see your presentation come to life
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden border-border/50 slide-preview relative group">
      <div className="h-full bg-background">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full border-0"
          title="Slide Preview"
        />
        
        {/* Fullscreen button */}
        {onFullscreen && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onFullscreen}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-medium"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
        )}
      </div>
    </Card>
  );
};