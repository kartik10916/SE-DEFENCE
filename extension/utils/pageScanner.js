/**
 * pageScanner.js — Utility functions for scanning web page content.
 * Used by both content.js and popup.js for consistent text extraction.
 */

/**
 * Extracts all visible text from a DOM node.
 * @param {Element} root - The root element to scan
 * @param {number}  limit - Character limit (default 10000)
 * @returns {string}
 */
function extractVisibleText(root = document.body, limit = 10000) {
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME']);

  function walk(node, parts) {
    if (parts.join(' ').length >= limit) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent.trim();
      if (t) parts.push(t);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS.has(node.tagName)) return;
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      node.childNodes.forEach(child => walk(child, parts));
    }
  }

  const parts = [];
  walk(root, parts);
  return parts.join(' ').slice(0, limit);
}

/**
 * Extracts all <a> href links from the document.
 * @returns {string[]}
 */
function extractLinks() {
  return Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.href)
    .filter(href => href.startsWith('http'));
}

/**
 * Gets the canonical URL or falls back to window.location.href.
 * @returns {string}
 */
function getPageUrl() {
  const canonical = document.querySelector('link[rel="canonical"]');
  return canonical ? canonical.href : window.location.href;
}

/**
 * Gets the page's main content: title + meta description + body text.
 * @returns {string}
 */
function getPageContent() {
  const title       = document.title || '';
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const body        = extractVisibleText(document.body, 8000);
  return [title, description, body].filter(Boolean).join('\n');
}

// Export for use in content scripts (no module system in extensions)
if (typeof window !== 'undefined') {
  window.SEDefenseScanner = { extractVisibleText, extractLinks, getPageUrl, getPageContent };
}
