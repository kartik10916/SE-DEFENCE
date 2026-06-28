/**
 * popup.js — SE Defense Assistant Extension Popup Logic
 */

const API_BASE = 'http://localhost:5000/api';

const BADGE_COLORS = {
  'Phishing':                { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#fca5a5' },
  'Urgency Manipulation':    { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', text: '#fdba74' },
  'Authority Impersonation': { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d' },
  'Pretexting':              { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#c4b5fd' },
  'Coercion / Intimidation': { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#fca5a5' },
  'Brand Spoofing':          { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#a5b4fc' },
  'URL Obfuscation':         { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.4)',  text: '#67e8f9' },
};

const SCORE_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#22c55e',
};

// ── DOM refs ─────────────────────────────────────────────────────────────────
const scanBtn        = document.getElementById('scan-page-btn');
const scanIcon       = document.getElementById('scan-icon');
const scanLabel      = document.getElementById('scan-label');
const resultPanel    = document.getElementById('result-panel');
const errorPanel     = document.getElementById('error-panel');
const errorMsg       = document.getElementById('error-msg');
const emptyState     = document.getElementById('empty-state');
const scoreCircle    = document.getElementById('score-circle');
const scoreValue     = document.getElementById('score-value');
const resultLevel    = document.getElementById('result-level');
const resultSummary  = document.getElementById('result-summary');
const attackTypes    = document.getElementById('attack-types-container');
const reasonsList    = document.getElementById('reasons-list');
const customText     = document.getElementById('custom-text');
const analyzeCustom  = document.getElementById('analyze-custom-btn');
const openWebapp     = document.getElementById('open-webapp');

// ── Helpers ────────────────────────────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 80) return SCORE_COLORS.critical;
  if (score >= 60) return SCORE_COLORS.high;
  if (score >= 30) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

function setLoading(isLoading) {
  scanBtn.disabled = isLoading;
  scanIcon.textContent  = isLoading ? '⏳' : '🔍';
  scanLabel.textContent = isLoading ? 'Scanning…' : 'Scan This Page';
}

function showError(msg) {
  errorPanel.hidden = false;
  resultPanel.hidden = true;
  emptyState.hidden  = true;
  errorMsg.textContent = msg;
}

function renderReport(report) {
  emptyState.hidden  = true;
  errorPanel.hidden  = true;
  resultPanel.hidden = false;

  const color = getScoreColor(report.riskScore);
  scoreValue.textContent   = report.riskScore;
  scoreValue.style.color   = color;
  scoreCircle.style.borderColor = color;
  scoreCircle.style.boxShadow   = `0 0 14px ${color}44`;
  resultLevel.textContent  = `${report.riskLevel} Risk`;
  resultLevel.style.color  = color;
  resultSummary.textContent = report.explanation?.summary || '';

  // Attack types
  attackTypes.innerHTML = '';
  (report.attackTypes || []).forEach(type => {
    const c = BADGE_COLORS[type] || BADGE_COLORS['Phishing'];
    const span = document.createElement('span');
    span.className = 'attack-badge-ext';
    span.textContent = type;
    span.style.cssText = `background:${c.bg};border-color:${c.border};color:${c.text}`;
    attackTypes.appendChild(span);
  });

  // Reasons
  reasonsList.innerHTML = '';
  const reasons = report.explanation?.reasons || [];
  reasons.slice(0, 5).forEach(reason => {
    const li = document.createElement('li');
    li.className = 'reason-ext';
    li.innerHTML = `<span>⚠️</span><span>${reason}</span>`;
    reasonsList.appendChild(li);
  });

  if (reasons.length === 0) {
    reasonsList.innerHTML = '<li class="reason-ext" style="color:#475569">No specific threats found.</li>';
  }
}

// ── Analyze via API ────────────────────────────────────────────────────────
async function analyzeViaAPI(text) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.report;
}

// ── Scan Page ──────────────────────────────────────────────────────────────
scanBtn.addEventListener('click', async () => {
  setLoading(true);
  errorPanel.hidden = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Ask content script to extract page text
    let pageText;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func:   () => document.body?.innerText || '',
      });
      pageText = results[0]?.result || '';
    } catch {
      pageText = tab.title + ' ' + tab.url;
    }

    if (!pageText.trim()) {
      showError('Could not extract text from this page.');
      return;
    }

    // Truncate to avoid huge payloads
    const truncated = pageText.slice(0, 8000);
    const report = await analyzeViaAPI(truncated);

    // Store in chrome.storage for history
    chrome.storage.local.get({ history: [] }, ({ history }) => {
      history.unshift({
        url:       tab.url,
        title:     tab.title,
        score:     report.riskScore,
        level:     report.riskLevel,
        timestamp: new Date().toISOString(),
      });
      chrome.storage.local.set({ history: history.slice(0, 20) });
    });

    // Badge on extension icon
    const badgeColor = getScoreColor(report.riskScore);
    chrome.action.setBadgeText({ text: String(report.riskScore), tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tab.id });

    renderReport(report);
  } catch (err) {
    showError(err.message.includes('fetch') ? 'Cannot reach backend. Is the server running on port 5000?' : err.message);
  } finally {
    setLoading(false);
  }
});

// ── Analyze Custom Text ────────────────────────────────────────────────────
analyzeCustom.addEventListener('click', async () => {
  const text = customText.value.trim();
  if (!text) return;

  analyzeCustom.disabled = true;
  analyzeCustom.textContent = 'Analyzing…';
  errorPanel.hidden = true;

  try {
    const report = await analyzeViaAPI(text);
    renderReport(report);
  } catch (err) {
    showError(err.message);
  } finally {
    analyzeCustom.disabled = false;
    analyzeCustom.textContent = 'Analyze';
  }
});

// ── Open Web App ──────────────────────────────────────────────────────────
openWebapp.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'http://localhost:3000' });
});
