'use client';

import React, { useMemo } from 'react';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
  fallbackText?: string;
}

export function SafeHtml({ html, className = '', fallbackText = '(No content provided)' }: SafeHtmlProps) {
  const cleanHtml = useMemo(() => {
    if (!html || !html.trim()) return '';
    return sanitizeHtml(html);
  }, [html]);

  if (!cleanHtml) {
    return <span className="text-slate-400 italic text-sm">{fallbackText}</span>;
  }

  return (
    <div
      dir="auto"
      className={`prose dark:prose-invert max-w-none break-words text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
