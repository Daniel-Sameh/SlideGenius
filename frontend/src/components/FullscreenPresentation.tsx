'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FullscreenPresentationProps {
  htmlContent: string;
  onClose: () => void;
}

export default function FullscreenPresentation({ htmlContent, onClose }: FullscreenPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Let reveal.js handle slide navigation internally
    setSlides(['']);
  }, [htmlContent]);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      // Use srcdoc for the complete HTML document
      iframe.srcdoc = htmlContent;
    }
  }, [htmlContent]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
        title="Exit Fullscreen (ESC)"
      >
        <X className="w-5 h-5" />
      </button>
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        title="Fullscreen Presentation"
      />
    </div>
  );
}
