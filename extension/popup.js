/**
 * popup.js — SE Defense Assistant Extension Popup Premium Logic
 */

const API_BASE = 'http://localhost:5000/api';

const BADGE_COLORS = {
  'Phishing':                { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#fca5a5' },
  'Urgency Manipulation':    { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#fdba74' },
  'Authority Impersonation': { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
  'Pretexting':              { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' },
  'Coercion / Intimidation': { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#fca5a5' },
  'Brand Spoofing':          { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc' },
  'URL Obfuscation':         { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.3)',  text: '#67e8f9' },
  'Data Harvesting':         { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', text: '#fbcfe8' },
};

const SCORE_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#22c55e',
};

// ── DOM References ───────────────────────────────────────────────────────────
const scanBtn          = document.getElementById('scan-page-btn');
const scanIcon         = document.getElementById('scan-icon');
const scanLabel        = document.getElementById('scan-label');
const resultPanel      = document.getElementById('result-panel');
const errorPanel       = document.getElementById('error-panel');
const errorMsg         = document.getElementById('error-msg');
const scanEmptyState   = document.getElementById('scan-empty-state');
const scoreValue       = document.getElementById('score-value');
const scoreBar         = document.getElementById('score-bar');
const resultLevel      = document.getElementById('result-level');
const resultSummary    = document.getElementById('result-summary');
const attackTypes      = document.getElementById('attack-types-container');
const reasonsList      = document.getElementById('reasons-list');

// Custom tab
const customText       = document.getElementById('custom-text');
const analyzeCustom    = document.getElementById('analyze-custom-btn');
const charCounter      = document.getElementById('char-counter');

// History tab
const historyList      = document.getElementById('history-list');
const historyEmpty     = document.getElementById('history-empty-state');
const clearHistoryBtn  = document.getElementById('clear-history-btn');

// Status Indicator
const statusDot        = document.getElementById('status-dot');
const statusText       = document.getElementById('status-text');

// Navigation
const tabButtons       = document.querySelectorAll('.tab-btn');
const tabPanels        = document.querySelectorAll('.tab-panel');
const openWebapp       = document.getElementById('open-webapp');

// ── Initialization & Live Status Check ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkBackendConnection();
  loadScanHistory();
});

async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Online';
      statusDot.parentElement.title = 'Connected to detection engine';
      scanBtn.disabled = false;
      analyzeCustom.disabled = false;
    } else {
      throw new Error();
    }
  } catch {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Offline';
    statusDot.parentElement.title = 'Could not reach backend API (port 5000)';
    showError('Cannot connect to SE Defense engine. Ensure the FastAPI server is running locally on port 5000.');
    scanBtn.disabled = true;
    analyzeCustom.disabled = true;
  }
}

// ── Tab Navigation Logic ─────────────────────────────────────────────────────
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    
    // Toggle active tab buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Toggle active panels
    tabPanels.forEach(panel => {
      if (panel.id === targetTab) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (targetTab === 'tab-history') {
      loadScanHistory();
    }
  });
});

// ── Helper functions ─────────────────────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 80) return SCORE_COLORS.critical;
  if (score >= 60) return SCORE_COLORS.high;
  if (score >= 30) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

function setLoading(isLoading) {
  scanBtn.disabled = isLoading;
  scanIcon.textContent  = isLoading ? '⏳' : '🔍';
  scanLabel.textContent = isLoading ? 'Scanning...' : 'Scan Current Page';
}

function showError(msg) {
  errorPanel.hidden = false;
  errorMsg.textContent = msg;
}

function renderReport(report) {
  scanEmptyState.hidden = true;
  errorPanel.hidden  = true;
  resultPanel.hidden = false;

  const color = getScoreColor(report.riskScore);
  
  // Update numerical score
  scoreValue.textContent = report.riskScore;
  scoreValue.style.color = color;
  
  // Update SVG circular gauge (circumference = 277)
  const offset = 277 - (277 * report.riskScore) / 100;
  scoreBar.style.stroke = color;
  scoreBar.style.strokeDashoffset = offset;
  
  // Metadata & Summary
  resultLevel.textContent = `${report.riskLevel} Risk`;
  resultLevel.style.color = color;
  resultSummary.textContent = report.explanation?.summary || 'No threat assessment narrative was generated.';

  // Render Attack Categories
  attackTypes.innerHTML = '';
  const types = report.attackTypes || [];
  types.forEach(type => {
    const c = BADGE_COLORS[type] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#94a3b8' };
    const span = document.createElement('span');
    span.className = 'attack-badge-ext';
    span.textContent = type;
    span.style.cssText = `background:${c.bg}; border-color:${c.border}; color:${c.text}`;
    attackTypes.appendChild(span);
  });

  if (types.length === 0) {
    attackTypes.innerHTML = '<span class="attack-badge-ext" style="background:rgba(255,255,255,0.03); border-color:transparent; color:#64748b">No Attack Vector</span>';
  }

  // Render Findings
  reasonsList.innerHTML = '';
  const reasons = report.explanation?.reasons || [];
  reasons.slice(0, 5).forEach(reason => {
    const li = document.createElement('li');
    li.className = 'reason-ext';
    li.innerHTML = `<span class="reason-bullet" style="color:${color}">⚠️</span> <span>${reason}</span>`;
    reasonsList.appendChild(li);
  });

  if (reasons.length === 0) {
    reasonsList.innerHTML = '<li class="reason-ext" style="color:#64748b">No specific threats identified. Content appears safe.</li>';
  }
}

// ── Analyze custom text input character counter ─────────────────────────────
customText.addEventListener('input', () => {
  const length = customText.value.length;
  charCounter.textContent = `${length.toLocaleString()} / 10,000`;
  if (length >= 10000) {
    charCounter.style.color = SCORE_COLORS.critical;
  } else {
    charCounter.style.color = '';
  }
});

// ── API Caller ───────────────────────────────────────────────────────────────
async function analyzeViaAPI(text) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server returned error status: ${response.status}`);
  }

  const data = await response.json();
  return data.report;
}

// ── Scan Current Tab Page ────────────────────────────────────────────────────
scanBtn.addEventListener('click', async () => {
  setLoading(true);
  errorPanel.hidden = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showError('Unable to identify active browser tab.');
      setLoading(false);
      return;
    }

    // Efficiency check: prevent system URLs from making API calls
    const isSystemUrl = tab.url.startsWith('chrome://') || 
                        tab.url.startsWith('chrome-extension://') || 
                        tab.url.startsWith('edge://') || 
                        tab.url.startsWith('about:') || 
                        tab.url === '';
    
    if (isSystemUrl) {
      showError('System or extensions settings pages cannot be scanned.');
      setLoading(false);
      return;
    }

    // Ask content script to extract page text
    let pageText = '';
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func:   () => document.body?.innerText || '',
      });
      pageText = results[0]?.result || '';
    } catch {
      // Fallback if content script fails or isn't injected (e.g. Chrome Web Store)
      pageText = (tab.title || '') + ' ' + (tab.url || '');
    }

    if (!pageText.trim()) {
      showError('Unable to extract readable text content from this page.');
      setLoading(false);
      return;
    }

    // Clean and truncate payload to respect API limit
    const truncated = pageText.slice(0, 10000);
    const report = await analyzeViaAPI(truncated);

    // Save scan to local history store
    chrome.storage.local.get({ history: [] }, ({ history }) => {
      // Avoid duplicate tabs adjacent in history
      const formattedTitle = tab.title || 'Webpage Assessment';
      const formattedUrl = tab.url.split('?')[0].slice(0, 60) + (tab.url.length > 60 ? '...' : '');

      history.unshift({
        url:       formattedUrl,
        title:     formattedTitle,
        score:     report.riskScore,
        level:     report.riskLevel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      
      // Limit list to 20 entries
      chrome.storage.local.set({ history: history.slice(0, 20) });
    });

    // Set badge indicator on extension icon
    const badgeColor = getScoreColor(report.riskScore);
    chrome.action.setBadgeText({ text: String(report.riskScore), tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tab.id });

    renderReport(report);
  } catch (err) {
    showError(err.message.includes('fetch') 
      ? 'Cannot reach backend. Is the FastAPI server running on port 5000?' 
      : err.message
    );
  } finally {
    setLoading(false);
  }
});

// ── Analyze Custom Text Input ────────────────────────────────────────────────
analyzeCustom.addEventListener('click', async () => {
  const text = customText.value.trim();
  if (!text) return;

  analyzeCustom.disabled = true;
  analyzeCustom.textContent = 'Analyzing...';
  errorPanel.hidden = true;

  try {
    const report = await analyzeViaAPI(text);
    renderReport(report);
    
    // Switch to active tab-scan panel to view results visually
    document.getElementById('btn-tab-scan').click();
  } catch (err) {
    showError(err.message);
  } finally {
    analyzeCustom.disabled = false;
    analyzeCustom.textContent = 'Analyze Input';
  }
});

// ── History List Renderer ────────────────────────────────────────────────────
function loadScanHistory() {
  chrome.storage.local.get({ history: [] }, ({ history }) => {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      historyEmpty.style.display = 'flex';
      clearHistoryBtn.hidden = true;
      return;
    }

    historyEmpty.style.display = 'none';
    clearHistoryBtn.hidden = false;

    history.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const color = getScoreColor(item.score);
      const bgStyle = `background: ${color}12; border: 1px solid ${color}33; color: ${color};`;

      li.innerHTML = `
        <div class="history-details">
          <div class="history-item-title" title="${item.title}">${item.title}</div>
          <div class="history-item-url" title="${item.url}">${item.url}</div>
        </div>
        <div class="history-score-badge" style="${bgStyle}">
          ${item.score}
        </div>
      `;
      historyList.appendChild(li);
    });
  });
}

// Clear History
clearHistoryBtn.addEventListener('click', () => {
  chrome.storage.local.set({ history: [] }, () => {
    loadScanHistory();
  });
});

// ── Open Full Web App ────────────────────────────────────────────────────────
openWebapp.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'http://localhost:3000' });
});
