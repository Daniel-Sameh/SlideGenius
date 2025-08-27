import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SlideGenerator } from "@/components/SlideGenerator";
import { FullscreenPresentation } from "@/components/FullscreenPresentation";
import { presentationService } from "@/services/presentationService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function PresentationEdit() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if the user has access to this presentation
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (id) {
      const presentation = presentationService.getById(id);
      if (!presentation || presentation.userId !== user.id) {
        toast({
          title: "Access denied",
          description: "You do not have permission to edit this presentation",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    }
  }, [id, user, navigate, toast]);

  return <SlideGenerator isEditMode={true} />;
}
