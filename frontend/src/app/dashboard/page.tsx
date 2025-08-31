'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import presentationService, { Presentation } from "@/services/presentation-service";
import { 
  Plus, 
  Presentation as PresentationIcon,
  Clock,
  Edit,
  Trash2,
  ArrowRight,
  LogOut
} from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const fetchPresentations = async () => {
      if (user) {
        try {
          const userPresentations = await presentationService.getAllByUser();
          setPresentations(userPresentations);
        } catch (error) {
          console.error('Error fetching presentations:', error);
          toast({
            title: "Error loading presentations",
            description: "Could not load your presentations. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchPresentations();
  }, [user, toast]);
  
  const handleCreateNew = () => {
    router.push("/create");
  };
  
  const handleEdit = (id: string) => {
    router.push(`/edit/${id}`);
  };
  
  const handleView = (id: string) => {
    router.push(`/presentation/${id}`);
  };
  
  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (deleteId) {
      try {
        const success = await presentationService.deletePresentation(deleteId);
        if (success) {
          setPresentations(prev => prev.filter(p => p.id !== deleteId));
          toast({
            title: "Presentation deleted",
            description: "The presentation has been successfully deleted.",
          });
        } else {
          throw new Error('Failed to delete presentation');
        }
      } catch (error) {
        toast({
          title: "Error deleting presentation",
          description: "An error occurred while deleting the presentation.",
          variant: "destructive",
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setDeleteId(null);
      }
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Unknown date";
    }
  };

  // Create description from markdown content
  const getDescriptionFromMarkdown = (markdown: string): string => {
    if (!markdown) return "No content available.";
    
    // Remove markdown syntax and get first few words
    const cleanText = markdown
      .replace(/[#*`_~[\]()]/g, '') // Remove markdown syntax
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    return cleanText.length > 100 
      ? cleanText.substring(0, 100) + "..."
      : cleanText || "No content available.";
  };
  
  const PresentationCard = ({ presentation }: { presentation: Presentation }) => (
    <Card key={presentation.id} className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30">
        <CardTitle className="truncate">{presentation.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Last updated: {formatDate(presentation.updated_at || presentation.updatedAt || '')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="line-clamp-3 text-sm text-muted-foreground h-12">
          {getDescriptionFromMarkdown(presentation.markdown_content || presentation.markdown || '')}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleEdit(presentation.id)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => confirmDelete(presentation.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
        
        <Button 
          size="sm" 
          onClick={() => handleView(presentation.id)}
        >
          <PresentationIcon className="w-4 h-4 mr-1" />
          View
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">SlideGenius</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground mt-1">Manage your presentations</p>
          </div>
          
          <Button 
            onClick={handleCreateNew} 
            className="bg-gradient-primary hover:shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Presentation
          </Button>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Presentations</TabsTrigger>
            <TabsTrigger value="recent">Recently Modified</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {presentations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presentations.map(presentation => (
                  <PresentationCard key={presentation.id} presentation={presentation} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed rounded-lg">
                <PresentationIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No presentations yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first presentation to get started
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Presentation
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent">
            {presentations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...presentations]
                  .sort((a, b) => new Date(b.updated_at || b.updatedAt || '').getTime() - new Date(a.updated_at || a.updatedAt || '').getTime())
                  .slice(0, 6)
                  .map(presentation => (
                    <PresentationCard key={presentation.id} presentation={presentation} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed rounded-lg">
                <PresentationIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No presentations yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first presentation to get started
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Presentation
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this presentation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}