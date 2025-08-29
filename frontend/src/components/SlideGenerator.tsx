'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import presentationService from '@/services/presentation-service';
import FullscreenPresentation from './FullscreenPresentation';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Eye, 
  Download,
  Sparkles 
} from 'lucide-react';

interface SlideGeneratorProps {
  onBack?: () => void;
  isEditMode?: boolean;
  existingPresentation?: any;
  onSave?: (data: any) => void;
}

export function SlideGenerator({ 
  onBack, 
  isEditMode = false, 
  existingPresentation,
  onSave 
}: SlideGeneratorProps) {
  const [markdown, setMarkdown] = useState(existingPresentation?.markdown || '');
  const [title, setTitle] = useState(existingPresentation?.title || '');
  const [theme, setTheme] = useState(existingPresentation?.theme || 'default');
  const [generatedHtml, setGeneratedHtml] = useState(existingPresentation?.html || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const generatePresentation = async () => {
    if (!markdown.trim()) {
      toast({
        title: "Content Required",
        description: "Please add markdown content before generating",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await presentationService.generateSlides({
        markdown_input: markdown,
        title: title || 'My Presentation',
        theme: theme,
      });
      
      setGeneratedHtml(result.html || '');
      
      toast({
        title: "Success!",
        description: isEditMode ? "Presentation updated - save to persist changes" : "Presentation created successfully",
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Could not generate presentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const savePresentation = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please log in to save presentations",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    if (!generatedHtml) {
      toast({
        title: "Nothing to Save",
        description: "Generate a presentation first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      if (isEditMode && existingPresentation?.id) {
        await presentationService.updatePresentation(existingPresentation.id, {
          title: title || 'My Presentation',
          markdown,
          html: generatedHtml,
          theme,
        });
        
        toast({
          title: "Updated!",
          description: "Presentation changes saved successfully",
        });
        
        if (onSave) {
          onSave({ title, markdown, html: generatedHtml, theme });
        } else {
          router.push('/dashboard');
        }
      } else {
        toast({
          title: "Saved!",
          description: "Check your dashboard for the saved presentation",
        });
        router.push('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Could not save presentation. Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPresentation = () => {
    if (!generatedHtml) {
      toast({
        title: "No Content",
        description: "Generate a presentation before downloading",
        variant: "destructive",
      });
      return;
    }

    const htmlBlob = new Blob([generatedHtml], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(htmlBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `${title || 'my-presentation'}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);
    
    toast({
      title: "Downloaded!",
      description: "Presentation saved as HTML file",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit Presentation' : 'Create Presentation'}
          </h1>
          
          <div className="flex gap-2">
            {generatedHtml && (
              <>
                <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button type="button" variant="outline" onClick={downloadPresentation}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            
            {isEditMode && generatedHtml && user && (
              <Button 
                type="button"
                onClick={savePresentation}
                disabled={isSaving}
                className="bg-gradient-primary hover:shadow-glow"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Content Input</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="presentation-title" className="block text-sm font-medium mb-2">
                  Presentation Title
                </label>
                <Input
                  id="presentation-title"
                  type="text"
                  placeholder="Enter your presentation title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="presentation-theme" className="block text-sm font-medium mb-2">
                  Visual Theme
                </label>
                <select
                  id="presentation-theme"
                  className="w-full p-2 border border-input bg-background rounded-md"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="default">Default Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="blue">Blue Theme</option>
                  <option value="minimal">Minimal Theme</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="markdown-content" className="block text-sm font-medium mb-2">
                  Markdown Content
                </label>
                <Textarea
                  id="markdown-content"
                  placeholder="Write your presentation content using Markdown syntax..."
                  className="min-h-[400px] font-mono"
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                />
              </div>
              
              <Button 
                type="button"
                onClick={generatePresentation}
                disabled={isGenerating}
                className="w-full bg-gradient-primary hover:shadow-glow"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Presentation
                  </>
                )}
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
            
            {generatedHtml ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={generatedHtml}
                  className="w-full h-[500px]"
                  title="Generated Presentation Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Your generated slides will appear here
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
      
      {showPreview && generatedHtml && (
        <FullscreenPresentation 
          htmlContent={generatedHtml} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
}