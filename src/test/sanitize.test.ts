import { describe, it, expect } from 'vitest';
import { sanitizeHtml, validateAttachmentUrl } from '@/lib/utils/sanitize';

describe('Sanitization & Security Defenses', () => {
  it('neutralizes XSS attacks in ticket body (Test Ticket T-2002)', () => {
    const maliciousBody = '<img src=x onerror="alert(\'hacked\')"> I was charged twice. <a href="https://example.com/invoice">Invoice</a>';
    const cleaned = sanitizeHtml(maliciousBody);

    // onerror handler MUST be stripped
    expect(cleaned).not.toContain('onerror');
    expect(cleaned).not.toContain("alert('hacked')");
    // Safe text and links MUST be preserved
    expect(cleaned).toContain('I was charged twice.');
    expect(cleaned).toContain('href="https://example.com/invoice"');
  });

  it('blocks dangerous javascript: URL in attachments (Test Ticket T-2003)', () => {
    const maliciousUrl = 'javascript:alert(document.cookie)';
    const result = validateAttachmentUrl(maliciousUrl);

    expect(result.isSafe).toBe(false);
    expect(result.sanitizedUrl).toBeNull();
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('Dangerous link protocol blocked');
  });

  it('permits valid HTTPS attachment links (Test Ticket T-2010)', () => {
    const validUrl = 'https://files.example.com/screenshots/export-bug.png';
    const result = validateAttachmentUrl(validUrl);

    expect(result.isSafe).toBe(true);
    expect(result.sanitizedUrl).toBe(validUrl);
    expect(result.warning).toBeUndefined();
  });

  it('neutralizes XSS embedded in AI summary output (Test Ticket T-2011)', () => {
    const maliciousSummary = '<img src=x onerror="alert(\'summary\')"> Customer asks about API rate limits.';
    const cleaned = sanitizeHtml(maliciousSummary);

    expect(cleaned).not.toContain('onerror');
    expect(cleaned).not.toContain("alert('summary')");
    expect(cleaned).toContain('Customer asks about API rate limits.');
  });

  it('handles null, undefined, or empty values safely', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(validateAttachmentUrl(null).isSafe).toBe(true);
  });
});
