import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Safely render markdown to HTML with XSS protection
 * Uses marked for markdown parsing and DOMPurify for sanitization
 *
 * @param markdown - Raw markdown string
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';

  try {
    // Parse markdown to HTML
    const rawHtml = marked.parse(markdown, {
      async: false,
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
    }) as string;

    // Sanitize HTML to prevent XSS
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    return cleanHtml;
  } catch (error) {
    console.error('Failed to sanitize markdown:', error);
    // Return empty string on error to prevent potential XSS
    return '';
  }
}

/**
 * Simple text-to-HTML converter with line breaks
 * For when you just need to convert newlines to <br> safely
 *
 * @param text - Plain text string
 * @returns Sanitized HTML with <br> tags
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  try {
    // First sanitize as plain text
    const cleaned = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      KEEP_CONTENT: true, // Keep text content
    });

    // Then convert newlines to <br>
    return cleaned.replace(/\n/g, '<br/>');
  } catch (error) {
    console.error('Failed to sanitize text:', error);
    return '';
  }
}

/**
 * Sanitize HTML string
 * Use when you already have HTML and just need to clean it
 *
 * @param html - Raw HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'span', 'div',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    });
  } catch (error) {
    console.error('Failed to sanitize HTML:', error);
    return '';
  }
}
