'use client';

import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MarkdownEditor = ({ value, onChange, placeholder }: MarkdownEditorProps) => {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-[500px] font-mono"
    />
  );
};
