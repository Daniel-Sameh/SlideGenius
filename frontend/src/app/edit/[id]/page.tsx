'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SlideGenerator } from "@/components/SlideGenerator";
import presentationService, { Presentation } from "@/services/presentation-service";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function EditPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push("/login");
        return;
      }
      
      if (id) {
        try {
          const presentationData = await presentationService.getById(id);
          if (!presentationData || presentationData.userId !== user.id) {
            toast({
              title: "Access denied",
              description: "You do not have permission to edit this presentation",
              variant: "destructive",
            });
            router.push("/dashboard");
          } else {
            setPresentation(presentationData);
          }
        } catch (error) {
          console.error('Error fetching presentation:', error);
          toast({
            title: "Error",
            description: "Failed to load the presentation. Please try again.",
            variant: "destructive",
          });
          router.push("/dashboard");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [id, user, router, toast]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleSave = async (updatedData: Partial<Presentation>) => {
    try {
      await presentationService.updatePresentation(id, updatedData);
      toast({
        title: "Success",
        description: "Presentation saved successfully",
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save presentation",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SlideGenerator 
      onBack={handleBack} 
      isEditMode={true} 
      existingPresentation={presentation}
      onSave={handleSave}
    />
  );
}