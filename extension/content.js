/**
 * content.js — SE Defense Content Script
 *
 * Injected into every page. Provides:
 * - Page text extraction for popup/background
 * - Visual warning banner for high-risk pages
 * - Message handler for background script communication
 */

(function () {
  'use strict';

  let warningBannerInjected = false;

  // ── Message listener ──────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_TEXT':
        sendResponse({ text: extractPageText() });
        break;
      case 'SHOW_WARNING':
        showWarningBanner(message.score, message.level, message.summary);
        sendResponse({ ok: true });
        break;
      case 'HIDE_WARNING':
        removeWarningBanner();
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  });

  // ── Page text extraction ──────────────────────────────────────────────────
  function extractPageText() {
    const IGNORE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'META', 'LINK']);
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (IGNORE_TAGS.has(node.parentElement?.tagName)) return NodeFilter.FILTER_REJECT;
          return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        },
      }
    );

    const parts = [];
    let node;
    while ((node = walker.nextNode())) {
      parts.push(node.textContent.trim());
      if (parts.join(' ').length > 10000) break; // limit
    }
    return parts.join(' ');
  }

  // ── Warning Banner ────────────────────────────────────────────────────────
  function showWarningBanner(score, level, summary) {
    if (warningBannerInjected) return;
    warningBannerInjected = true;

    const color = score >= 80 ? '#ef4444' : '#f97316';
    const banner = document.createElement('div');
    banner.id = 'se-defense-warning';
    banner.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 2147483647;
      background: ${color}ee;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.4);
    `;

    banner.innerHTML = `
      <span>
        🛡️ <strong>SE Defense Warning</strong> — ${level} Risk (${score}/100):
        <span style="font-weight:400;margin-left:4px">${summary || 'Potential social engineering threat detected.'}</span>
      </span>
      <button id="se-dismiss" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.4);
        color: #fff; cursor: pointer;
        border-radius: 4px; padding: 3px 10px; font-size: 11px;
      ">Dismiss</button>
    `;

    document.body.prepend(banner);
    document.getElementById('se-dismiss')?.addEventListener('click', removeWarningBanner);
  }

  function removeWarningBanner() {
    const b = document.getElementById('se-defense-warning');
    if (b) { b.remove(); warningBannerInjected = false; }
  }
})();
