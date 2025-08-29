'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import FullscreenPresentation from "@/components/FullscreenPresentation";
import presentationService from "@/services/presentation-service";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

        setPresentationHtml(presentation.html || null);
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
      <div className="fixed top-0 left-0 m-6 z-50">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <FullscreenPresentation 
        htmlContent={presentationHtml} 
        onClose={() => router.push("/dashboard")} 
      />
    </div>
  );
}