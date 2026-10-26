import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes rich customer or AI HTML while permitting safe formatting tags
 * and stripping out all malicious scripts, event handlers, and unsafe protocols.
 */
export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml) return '';

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'b', 'strong', 'i', 'em', 'u', 's', 'strike',
      'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre',
      'blockquote', 'span', 'div', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target', 'rel'],
    // Ensure all <a> tags open securely
  });
}

export interface AttachmentValidation {
  isSafe: boolean;
  sanitizedUrl: string | null;
  warning?: string;
}

/**
 * Validates attachment links to ensure they are safe http/https URLs.
 * Detects and neutralizes malicious javascript: or arbitrary URI schemes.
 */
export function validateAttachmentUrl(url: string | null | undefined): AttachmentValidation {
  if (!url || typeof url !== 'string') {
    return { isSafe: true, sanitizedUrl: null };
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return { isSafe: true, sanitizedUrl: null };
  }

  // Check for dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return {
      isSafe: false,
      sanitizedUrl: null,
      warning: 'Dangerous link protocol blocked for security (potential script execution).',
    };
  }

  // Ensure it's a valid HTTP/HTTPS URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { isSafe: true, sanitizedUrl: trimmed };
    }
    return {
      isSafe: false,
      sanitizedUrl: null,
      warning: `Disallowed URL protocol: ${parsed.protocol}`,
    };
  } catch {
    // Relative URL or invalid URL format
    if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
      return { isSafe: true, sanitizedUrl: trimmed };
    }
    return {
      isSafe: false,
      sanitizedUrl: null,
      warning: 'Malformed attachment link.',
    };
  }
}

/**
 * Escapes plain text for safe rendering when HTML is not permitted.
 */
export function escapePlainText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
