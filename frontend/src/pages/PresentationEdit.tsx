import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SlideGenerator } from "@/components/SlideGenerator";
import { FullscreenPresentation } from "@/components/FullscreenPresentation";
import presentationService from "@/services/presentationService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function PresentationEdit() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the user has access to this presentation
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate("/login");
        return;
      }
      
      if (id) {
        try {
          const presentation = await presentationService.getById(id);
          if (!presentation || presentation.userId !== user.id) {
            toast({
              title: "Access denied",
              description: "You do not have permission to edit this presentation",
              variant: "destructive",
            });
            navigate("/dashboard");
          }
        } catch (error) {
          console.error('Error fetching presentation:', error);
          toast({
            title: "Error",
            description: "Failed to load the presentation. Please try again.",
            variant: "destructive",
          });
          navigate("/dashboard");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [id, user, navigate, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <SlideGenerator isEditMode={true} />;
}
