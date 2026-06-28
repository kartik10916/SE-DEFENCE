/**
 * background.js — SE Defense Extension Service Worker (Manifest V3)
 *
 * Responsibilities:
 * - Listen for tab updates and auto-scan high-risk pages
 * - Manage context menu for right-click text analysis
 * - Communicate with popup and content scripts
 */

const API_BASE = 'http://localhost:5000/api';
const HIGH_RISK_THRESHOLD = 60;

// ── Install: create context menu ───────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id:       'se-analyze-selection',
    title:    '🛡️ Analyze with SE Defense',
    contexts: ['selection'],
  });

  console.log('[SE Defense] Extension installed. Context menu created.');
});

// ── Context menu click ─────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'se-analyze-selection') return;

  const text = info.selectionText?.trim();
  if (!text) return;

  try {
    const report = await analyzeText(text);
    await notifyIfHighRisk(report, tab);

    // Store result so popup can display it
    await chrome.storage.session.set({ lastReport: report, lastText: text });

    chrome.action.setBadgeText({ text: String(report.riskScore), tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({
      color: getScoreColor(report.riskScore),
      tabId: tab.id,
    });
  } catch (err) {
    console.error('[SE Defense] Context analysis error:', err);
  }
});

// ── Tab update: auto-check URL ─────────────────────────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url?.startsWith('http')) return;

  // Quick URL-only analysis on page load
  try {
    const report = await analyzeText(tab.url + ' ' + (tab.title || ''));
    if (report.riskScore >= HIGH_RISK_THRESHOLD) {
      chrome.action.setBadgeText({ text: '!', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId });
      await notifyIfHighRisk(report, tab);
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch {
    // Silently fail — backend may not be running
  }
});

// ── Messages from popup / content script ──────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ANALYZE_TEXT') {
    analyzeText(message.text)
      .then(report => sendResponse({ success: true, report }))
      .catch(err  => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────
async function analyzeText(text) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text: text.slice(0, 8000) }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  return data.report;
}

async function notifyIfHighRisk(report, tab) {
  if (report.riskScore < HIGH_RISK_THRESHOLD) return;

  chrome.notifications.create(`se-alert-${Date.now()}`, {
    type:    'basic',
    iconUrl: 'icons/128.png',
    title:   `⚠️ SE Defense: ${report.riskLevel} Risk Detected`,
    message: report.explanation?.summary || `Risk score: ${report.riskScore}/100`,
    priority: 2,
  });
}

function getScoreColor(score) {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 30) return '#f59e0b';
  return '#22c55e';
}
