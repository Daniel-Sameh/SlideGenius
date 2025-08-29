'use client';

import { useEffect, useRef } from 'react';

interface SlidePreviewProps {
  html: string;
}

export const SlidePreview = ({ html }: SlidePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.srcdoc = html;
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full"
      sandbox="allow-scripts allow-same-origin"
      title="Slide Preview"
    />
  );
};
