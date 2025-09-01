'use client';

import { Button } from "@/components/ui/button";
import { ArrowDown, Sparkles, Zap, Presentation } from "lucide-react";
import RippleGrid from "@/components/ui/RippleGrid";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      
      {/* Prism Background */}
      <div className="absolute inset-0">
        <RippleGrid
          enableRainbow={false}
          gridColor="#8b5cf6"
          rippleIntensity={0.08}
          gridSize={5}
          gridThickness={10}
          mouseInteraction={true}
          mouseInteractionRadius={0.9}
          opacity={0.7}
          glowIntensity={0.3}
          fadeDistance={3}
          vignetteStrength={5}
          gridRotation={25}
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="container relative z-10 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-8 animate-pulse">
            <Sparkles className="w-4 h-4 animate-bounce-gentle" />
            <span className="bg-gradient-to-r from-white via-white/90 to-white bg-clip-text text-transparent animate-fade-in">
              AI-Powered Presentation Generator
            </span>
          </div>
          
          <div className="mb-4">
            <h1 className="text-6xl md:text-8xl font-bold leading-tight bg-gradient-to-r from-purple-500 via-white to-purple-400 bg-clip-text text-transparent mb-2 drop-shadow-2xl">
              SlideGenius
            </h1>
            <p className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-purple-200 via-white to-purple-400 bg-clip-text text-transparent">
              From Markdown to Beautiful Slides
            </p>
          </div>
          
          <p className="text-xl md:text-2xl text-white/95 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
            Transform your ideas into stunning presentations with AI-suggested themes and professional layouts. 
            Just paste your markdown, and watch the magic happen.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-white text-primary hover:bg-white/90 shadow-glow px-8 py-4 text-lg font-semibold group"
            >
              <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce-gentle" />
              Start Creating
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/50 text-primary bg-white hover:bg-white/90 hover:text-primary backdrop-blur-sm px-8 py-4 text-lg font-semibold transition-all duration-300"
            >
              <Presentation className="w-5 h-5 mr-2" />
              See Example
            </Button>
          </div>
          
          <div className="pt-16">
            <ArrowDown className="w-6 h-6 mx-auto animate-bounce-gentle text-white/70" />
          </div>
        </div>
      </div>
    </section>
  );
};
