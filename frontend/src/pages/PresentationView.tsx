import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FullscreenPresentation } from "@/components/FullscreenPresentation";
import presentationService from "@/services/presentationService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PresentationView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [presentationHtml, setPresentationHtml] = useState<string | null>(null);
  
  useEffect(() => {
    const loadPresentation = async () => {
      if (!id) {
        navigate("/dashboard");
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
          navigate("/dashboard");
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
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPresentation();
  }, [id, navigate, toast]);

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
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 left-0 m-6 z-50">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <FullscreenPresentation 
        htmlContent={presentationHtml} 
        onClose={() => navigate("/dashboard")} 
      />
    </div>
  );
}
