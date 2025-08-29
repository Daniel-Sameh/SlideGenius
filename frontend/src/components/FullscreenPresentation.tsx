'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FullscreenPresentationProps {
  htmlContent: string;
  onClose: () => void;
}

export default function FullscreenPresentation({ htmlContent, onClose }: FullscreenPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Parse slides from HTML content
    const slideElements = htmlContent.split('<section').filter(section => section.trim().length > 0);
    const parsedSlides = slideElements.map((slide, index) => {
      if (index === 0) return slide;
      return '<section' + slide;
    });
    setSlides(parsedSlides);
  }, [htmlContent]);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.srcdoc = slides[currentSlide] || htmlContent;
    }
  }, [currentSlide, htmlContent, slides]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
          aria-label="Close presentation"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <iframe
          ref={iframeRef}
          className="w-full h-full bg-white rounded-lg shadow-2xl"
          sandbox="allow-scripts allow-same-origin"
          title="Fullscreen Presentation"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="text-white hover:bg-white/20 disabled:opacity-50"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </Button>
        
        <div className="flex gap-2" role="group" aria-label="Slide navigation">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? "true" : "false"}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="text-white hover:bg-white/20 disabled:opacity-50"
          aria-label="Next slide"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
