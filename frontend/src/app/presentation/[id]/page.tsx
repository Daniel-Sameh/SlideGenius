'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import FullscreenPresentation from "@/components/FullscreenPresentation";
import presentationService from "@/services/presentation-service";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize, ExternalLink } from "lucide-react";

export default function PresentationViewPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [presentationHtml, setPresentationHtml] = useState<string | null>(null);
  
  useEffect(() => {
    const loadPresentation = async () => {
      if (!id) {
        router.push("/dashboard");
        return;
      }

      try {
        const presentation = await presentationService.getById(id);
        if (!presentation) {
          toast({
            title: "Not found",
            description: "The requested presentation could not be found.",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }

        setPresentationHtml(presentation.html_content || presentation.html || null);
      } catch (error) {
        console.error('Error loading presentation:', error);
        toast({
          title: "Error",
          description: "Failed to load the presentation. Please try again.",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPresentation();
  }, [id, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!presentationHtml) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">No content available</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-[60] flex gap-1">
        <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => router.push("/dashboard")} title="Back to Dashboard">
          <ArrowLeft className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => {
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(presentationHtml);
            newWindow.document.close();
          }
        }} title="Open in New Tab">
          <ExternalLink className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => {
          const elem = document.documentElement;
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          }
        }} title="Fullscreen">
          <Maximize className="w-3 h-3" />
        </Button>
      </div>
      <FullscreenPresentation 
        htmlContent={presentationHtml} 
        onClose={() => router.push("/dashboard")} 
      />
    </div>
  );
}