'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/HeroSection";
import { SlideGenerator } from "@/components/SlideGenerator";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'hero' | 'generator'>('hero');
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      // User is logged in, allow them to create
      setCurrentView('generator');
    } else {
      // User is not logged in, redirect to sign in
      router.push('/login');
    }
  };

  const handleBackToHero = () => {
    setCurrentView('hero');
  };

  const renderHeader = () => {
    if (user) {
      return (
        <div className="absolute top-0 right-0 m-6 z-50">
          <Button 
            variant="outline" 
            className="border-white/50 text-primary hover:bg-white/90 hover:text-primary"
            onClick={() => router.push("/dashboard")}
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
          <Link href="/login">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Link>
        </Button>
        <Button 
          className="bg-white text-primary hover:bg-white/90"
          asChild
        >
          <Link href="/register">
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
}