import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { SlidePreview } from "@/components/SlidePreview";
import { FullscreenPresentation } from "@/components/FullscreenPresentation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { presentationService, Presentation } from "@/services/presentationService";
import { 
  Sparkles, 
  ArrowLeft, 
  Save,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SlideGeneratorProps {
  onBack?: () => void;
  isEditMode?: boolean;
}

export const SlideGenerator = ({ onBack, isEditMode = false }: SlideGeneratorProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [markdown, setMarkdown] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  // Load presentation if in edit mode
  useEffect(() => {
    if (isEditMode && id && user) {
      const presentation = presentationService.getById(id);
      if (presentation && presentation.userId === user.id) {
        setTitle(presentation.title);
        setDescription(presentation.description || "");
        setMarkdown(presentation.markdown);
        if (presentation.html) {
          setGeneratedHtml(presentation.html);
        }
      } else {
        toast({
          title: "Presentation not found",
          description: "The requested presentation could not be loaded.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    }
  }, [isEditMode, id, user, navigate, toast]);

  const generateSlides = async () => {
    if (!markdown.trim()) {
      toast({
        title: "Please add some content",
        description: "Add your markdown content before generating slides.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock generated HTML with Reveal.js
      const mockHtml = `
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/reveal.js@4/dist/reveal.css">
    <link rel="stylesheet" href="https://unpkg.com/reveal.js@4/dist/theme/moon.css">
    <style>
      .reveal .slides section { text-align: left; }
      .reveal h1, .reveal h2, .reveal h3 { text-align: center; }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${markdown.split('---').map(slide => 
              `<section data-markdown><textarea data-template>${slide.trim()}</textarea></section>`
            ).join('')}
        </div>
    </div>
    <script src="https://unpkg.com/reveal.js@4/dist/reveal.js"></script>
    <script src="https://unpkg.com/reveal.js@4/plugin/markdown/markdown.js"></script>
    <script>
        Reveal.initialize({
            plugins: [ RevealMarkdown ],
            hash: true,
            transition: 'slide'
        });
    </script>
</body>
</html>`;
      
      setGeneratedHtml(mockHtml);
      toast({
        title: "Slides generated successfully!",
        description: "Your presentation is ready. Use arrow keys to navigate.",
      });
    } catch (error) {
      toast({
        title: "Error generating slides",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const openSaveDialog = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save presentations.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setIsSaveDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your presentation.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication error",
        description: "You need to be logged in to save presentations.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSaving(true);

    try {
      const presentationData: Partial<Presentation> = {
        id: isEditMode && id ? id : `pres_${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        description: description.trim() || undefined,
        markdown,
        html: generatedHtml,
        userId: user.id
      };

      presentationService.save(presentationData as Presentation);
      
      setIsSaveDialogOpen(false);
      toast({
        title: "Presentation saved",
        description: "Your presentation has been successfully saved.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error saving presentation",
        description: "An error occurred while saving your presentation.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">SlideGenius</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Slide Generator</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {generatedHtml && (
              <Button 
                variant="outline" 
                onClick={openSaveDialog}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? "Update" : "Save"}
              </Button>
            )}
            
            <Button 
              onClick={generateSlides} 
              disabled={isGenerating || !markdown.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Slides"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-10rem)]">
          {/* Editor */}
          <div className="slide-enter">
            <MarkdownEditor
              value={markdown}
              onChange={setMarkdown}
            />
          </div>
          
          {/* Preview */}
          <div className="slide-enter delay-100">
            <SlidePreview
              htmlContent={generatedHtml}
              isGenerating={isGenerating}
              onFullscreen={generatedHtml ? () => setShowFullscreen(true) : undefined}
            />
          </div>
        </div>
      </main>

      {/* Fullscreen Presentation */}
      {showFullscreen && generatedHtml && (
        <FullscreenPresentation
          htmlContent={generatedHtml}
          onClose={() => setShowFullscreen(false)}
        />
      )}

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Update Presentation" : "Save Presentation"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update the details of your presentation." 
                : "Enter the details to save your presentation."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                placeholder="My Awesome Presentation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
              <Textarea
                id="description"
                placeholder="A brief description of your presentation"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? "Update" : "Save"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};