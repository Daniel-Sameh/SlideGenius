import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FullscreenPresentationProps {
  htmlContent: string;
  onClose: () => void;
}

export const FullscreenPresentation = ({ htmlContent, onClose }: FullscreenPresentationProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (!iframeRef.current?.contentWindow) return;

      // Forward arrow keys to Reveal.js
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        try {
          iframeRef.current.contentWindow.postMessage({
            type: 'navigate',
            direction: event.key === 'ArrowLeft' ? 'prev' : 'next'
          }, '*');
        } catch (error) {
          console.log('Navigation message sent');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
    toast({
      title: "Presentation ready!",
      description: "Use arrow keys or buttons to navigate slides. Press ESC to exit fullscreen.",
    });

    // Inject navigation script into iframe
    if (iframeRef.current?.contentWindow) {
      const script = `
        window.addEventListener('message', function(event) {
          if (event.data.type === 'navigate' && window.Reveal) {
            if (event.data.direction === 'next') {
              Reveal.next();
            } else if (event.data.direction === 'prev') {
              Reveal.prev();
            }
          }
        });
      `;
      
      try {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          const scriptElement = doc.createElement('script');
          scriptElement.textContent = script;
          doc.head.appendChild(scriptElement);
        }
      } catch (error) {
        console.log('Script injection attempted');
      }
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (!iframeRef.current?.contentWindow) return;
    
    try {
      iframeRef.current.contentWindow.postMessage({
        type: 'navigate',
        direction
      }, '*');
    } catch (error) {
      console.log('Navigation attempted');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Controls */}
      <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">SlideGenius Presentation</h2>
          {isLoaded && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('next')}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Press ESC to exit</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Presentation */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-0"
          title="Fullscreen Presentation"
          onLoad={handleIframeLoad}
        />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <p className="text-lg font-medium">Loading presentation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};