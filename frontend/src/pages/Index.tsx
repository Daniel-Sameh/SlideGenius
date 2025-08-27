import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { SlideGenerator } from "@/components/SlideGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, LayoutDashboard } from "lucide-react";

const Index = () => {
  const [currentView, setCurrentView] = useState<'hero' | 'generator'>('hero');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    setCurrentView('generator');
  };

  const handleBackToHero = () => {
    setCurrentView('hero');
  };

  // Render the header with login/register buttons
  const renderHeader = () => {
    if (user) {
      return (
        <div className="absolute top-0 right-0 m-6 z-50">
          <Button 
            variant="outline" 
            className="border-white/50 text-white hover:bg-white hover:text-primary"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      );
    }
    
    return (
      <div className="absolute top-0 right-0 m-6 z-50 flex gap-2">
        <Button 
          variant="outline" 
          className="border-white/50 text-primary hover:bg-white/90 hover:text-primary"
          asChild
        >
          <Link to="/login">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Link>
        </Button>
        <Button 
          className="bg-white text-primary hover:bg-white/90"
          asChild
        >
          <Link to="/register">
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Link>
        </Button>
      </div>
    );
  };

  if (currentView === 'generator') {
    return <SlideGenerator onBack={handleBackToHero} />;
  }

  return (
    <>
      {renderHeader()}
      <HeroSection onGetStarted={handleGetStarted} />
    </>
  );
};

export default Index;
