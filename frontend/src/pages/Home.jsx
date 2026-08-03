import React, { useState, useCallback, useEffect } from 'react';
import TextInput       from '../components/TextInput';
import AnalyzeButton   from '../components/AnalyzeButton';
import RiskCard        from '../components/RiskCard';
import ReasonList      from '../components/ReasonList';
import HighlightedText from '../components/HighlightedText';
import AttackType      from '../components/AttackType';
import ExportButton    from '../components/ExportButton';
import { useToast }    from '../components/Toast';
import { analyzeText } from '../api/analyzeAPI';

/* ── Loading animation ─────────────────────────────────────────────────────── */
const STEPS = [
  { id: 'kw',   label: 'Scanning for suspicious keywords…' },
  { id: 'url',  label: 'Analyzing URLs and link patterns…' },
  { id: 'tone', label: 'Evaluating emotional tone…'        },
  { id: 'calc', label: 'Computing risk assessment…'        },
];

const LoadingCard = ({ step }) => (
  <div className="card empty-card loading-card">
    <div className="loading-spinner-ring" aria-hidden="true" />
    <div className="loading-label">Processing Analysis</div>
    <div className="loading-sub">Multi-layer threat detection in progress</div>
    <div className="loading-steps">
      {STEPS.map((s, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <div key={s.id} className={`loading-step ${done ? 'done' : active ? 'active' : ''}`}>
            <div className={`step-dot ${done ? 'done' : active ? 'active' : ''}`} />
            {s.label}
          </div>
        );
      })}
    </div>
  </div>
);

/* ── Stats bar ─────────────────────────────────────────────────────────────── */
const StatsBar = ({ stats, lastReport }) => {
  if (!stats) return null;
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-num">{stats.totalScans.toLocaleString()}</span>
        <span className="stat-label">Total Scans</span>
      </div>
      <div className="stat-sep" />
      {lastReport && (
        <>
          <div className="stat-item">
            <span className="stat-num">{lastReport.attackTypes.length}</span>
            <span className="stat-label">Threats Found</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-item">
            <span className="stat-num">{lastReport.analysisTime}ms</span>
            <span className="stat-label">Analysis Time</span>
          </div>
          <div className="stat-sep" />
        </>
      )}
      <div className="stat-item">
        <span className="stat-num">{stats.uptime ? `${Math.floor(stats.uptime / 60)}m` : '—'}</span>
        <span className="stat-label">Uptime</span>
      </div>
    </div>
  );
};

/* ── Sentiment panel ───────────────────────────────────────────────────────── */
const toneClass = (label = '') => {
  if (label.includes('Highly'))    return 'high';
  if (label.includes('Moderately'))return 'moderate';
  if (label.includes('Mildly'))    return 'mild';
  return 'neutral';
};

const TONE_META = {
  neutral:  { icon: '😌', color: '#22c55e' },
  mild:     { icon: '😟', color: '#eab308' },
  moderate: { icon: '😠', color: '#f97316' },
  high:     { icon: '😱', color: '#ef4444' },
};

const KwGroup = ({ label, words, color }) => {
  if (!words?.length) return null;
  return (
    <div className="kw-group">
      <div className="kw-group-label">{label}</div>
      <div className="kw-pills">
        {words.map(w => (
          <span key={w} className="kw-pill" style={{
            background: `${color}14`, borderColor: `${color}40`, color,
          }}>{w}</span>
        ))}
      </div>
    </div>
  );
};

const SentimentPanel = ({ sentiment }) => {
  const cls  = toneClass(sentiment.toneLabel);
  const meta = TONE_META[cls] || TONE_META.neutral;
  const noSignals = !sentiment.fearWords.length && !sentiment.urgencyPhrases.length && !sentiment.coercionPhrases.length;

  return (
    <div>
      <div className="tone-header">
        <div className="tone-icon" aria-hidden="true">{meta.icon}</div>
        <div className="tone-info">
          <div className="tone-level">Tone Assessment</div>
          <div className="tone-label" style={{ color: meta.color }}>{sentiment.toneLabel}</div>
        </div>
      </div>
      <KwGroup label="Fear language"    words={sentiment.fearWords}      color="#fca5a5" />
      <KwGroup label="Urgency phrases"  words={sentiment.urgencyPhrases} color="#fde047" />
      <KwGroup label="Coercion phrases" words={sentiment.coercionPhrases} color="#fdba74" />
      {noSignals && (
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          No threatening sentiment patterns detected in this message.
        </p>
      )}
    </div>
  );
};

/* ── URL list ──────────────────────────────────────────────────────────────── */
const UrlList = ({ urlResult }) => {
  if (!urlResult.allUrls.length) {
    return <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>No URLs found in this message.</p>;
  }

  return (
    <div className="url-list">
      {urlResult.suspiciousUrls.map((u, i) => {
        const color = u.score >= 70 ? '#ef4444' : u.score >= 40 ? '#f97316' : '#eab308';
        return (
          <div key={i} className="url-entry">
            <div className="url-entry-head">
              <span className="url-href">{u.url}</span>
              <span className="url-score-pill" style={{
                background: `${color}14`, borderColor: `${color}38`, color,
              }}>Risk {u.score}/100</span>
            </div>
            {u.reasons.length > 0 && (
              <div className="url-findings">
                {u.reasons.map((r, j) => (
                  <div key={j} className="url-finding">{r}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── History sidebar ───────────────────────────────────────────────────────── */
const HistoryPanel = ({ history, onSelect }) => {
  if (history.length === 0) return null;

  const riskColor = (level) => {
    if (level === 'Critical') return '#ef4444';
    if (level === 'High') return '#f97316';
    if (level === 'Medium') return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="history-panel">
      <div className="section-label">📊 Recent Analyses</div>
      <div className="history-list">
        {history.slice(0, 5).map((h, i) => (
          <button
            key={h.id || i}
            className="history-item"
            onClick={() => onSelect(h)}
            type="button"
            aria-label={`View analysis: ${h.riskLevel} risk, score ${h.riskScore}`}
          >
            <div className="history-dot" style={{ background: riskColor(h.riskLevel) }} />
            <div className="history-body">
              <div className="history-preview">{h.inputPreview || '—'}</div>
              <div className="history-meta">
                <span style={{ color: riskColor(h.riskLevel) }}>{h.riskLevel}</span>
                <span>·</span>
                <span>{h.riskScore}/100</span>
                <span>·</span>
                <span>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Tab definitions ───────────────────────────────────────────────────────── */
const buildTabs = (report) => [
  { id: 'findings', label: 'Findings',     badge: report.explanation.totalFindings || report.explanation.reasons.length, danger: report.explanation.reasons.length > 0 },
  { id: 'threats',  label: 'Attack Types',  badge: report.attackTypes.length, danger: report.attackTypes.length > 0 },
  { id: 'tone',     label: 'Tone',          badge: null },
  { id: 'text',     label: 'Highlighted',   badge: report.highlights.length },
  { id: 'urls',     label: 'Links',         badge: report.urls.totalUrls, danger: report.urls.score >= 40 },
];

/* ── Main Home page ────────────────────────────────────────────────────────── */
const Home = () => {
  const [inputText, setInputText] = useState('');
  const [report,    setReport]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [loadStep,  setLoadStep]  = useState(0);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('findings');
  const [stats,     setStats]     = useState(null);
  const [history,   setHistory]   = useState([]);

  const { addToast, ToastContainer } = useToast();

  // Fetch stats on mount and after each scan
  const fetchStats = useCallback(() => {
    fetch('http://localhost:5000/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setLoadStep(0);
    setError(null);
    setReport(null);

    const stepTimer = setInterval(() => {
      setLoadStep(s => Math.min(s + 1, STEPS.length - 1));
    }, 300);

    try {
      const result = await analyzeText(inputText);
      clearInterval(stepTimer);
      setReport(result);
      setActiveTab('findings');

      // Update history
      setHistory(prev => {
        const next = [{ ...result, inputPreview: inputText.slice(0, 120) }, ...prev];
        return next.slice(0, 10);
      });

      // Toast
      const lvl = result.riskLevel;
      const type = lvl === 'Critical' || lvl === 'High' ? 'warning' : lvl === 'Medium' ? 'info' : 'success';
      addToast(`Analysis complete — ${lvl} risk (${result.riskScore}/100)`, type);

      // Refresh stats
      fetchStats();

      setTimeout(() => {
        document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (err) {
      clearInterval(stepTimer);
      const msg = err.response?.data?.error || err.message || 'Could not reach the backend. Make sure the server is running on port 5000.';
      setError(msg);
      addToast('Analysis failed — check backend connection', 'error');
    } finally {
      setLoading(false);
    }
  }, [inputText, addToast, fetchStats]);

  const handleClear = () => {
    setInputText('');
    setReport(null);
    setError(null);
  };

  const handleHistorySelect = (item) => {
    setReport(item);
    setActiveTab('findings');
    addToast('Loaded previous analysis', 'info');
  };

  const tabs = report ? buildTabs(report) : [];

  return (
    <>
      <ToastContainer />

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <StatsBar stats={stats} lastReport={report} />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <header className="hero">
        <div className="hero-eyebrow">
          <span aria-hidden="true">🛡️</span> Threat Intelligence Platform
        </div>
        <h1>
          Detect <em>Social Engineering</em> Attacks
        </h1>
        <p className="hero-desc">
          Paste any email, SMS, or message below. Our multi-layer engine
          scans for phishing, manipulation tactics, and malicious URLs — instantly.
        </p>
        <div className="hero-pills" aria-label="Detection capabilities">
          {['Phishing Detection', 'Urgency Analysis', 'Authority Checks', 'URL Scanning', 'Sentiment Analysis'].map(f => (
            <span key={f} className="hero-pill">{f}</span>
          ))}
        </div>
      </header>

      {/* ── Input card ─────────────────────────────────────────────────────── */}
      <div className="card input-card">
        <TextInput value={inputText} onChange={setInputText} onClear={handleClear} />
        <div className="input-action-row">
          {inputText.trim() && (
            <button className="btn-ghost" onClick={handleClear} type="button" aria-label="Clear message">
              ✕ Clear
            </button>
          )}
          <AnalyzeButton
            onClick={handleAnalyze}
            loading={loading}
            disabled={!inputText.trim()}
          />
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner" role="alert" aria-live="assertive">
          <span className="error-icon" aria-hidden="true">✕</span>
          <div>
            <strong>Analysis failed.</strong><br />
            {error}
          </div>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {loading && <LoadingCard step={loadStep} />}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!report && !loading && !error && (
        <div className="card empty-card">
          <div className="empty-visual" aria-hidden="true">🔍</div>
          <div className="empty-title">Ready to Analyze</div>
          <div className="empty-body">
            Paste a suspicious message above and click{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>Check for Threats</strong>{' '}
            to run a full multi-layer analysis.
          </div>
          <div className="empty-features">
            <div className="empty-feature">
              <div className="empty-feature-icon">🎣</div>
              <div className="empty-feature-text">Phishing<br/>Detection</div>
            </div>
            <div className="empty-feature">
              <div className="empty-feature-icon">🔗</div>
              <div className="empty-feature-text">URL<br/>Analysis</div>
            </div>
            <div className="empty-feature">
              <div className="empty-feature-icon">🧠</div>
              <div className="empty-feature-text">Sentiment<br/>Analysis</div>
            </div>
            <div className="empty-feature">
              <div className="empty-feature-icon">👮</div>
              <div className="empty-feature-text">Authority<br/>Checks</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {report && (
        <div className="results-section" id="results-top" aria-live="polite">
          <div className="results-header-row">
            <div className="section-label" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              📊 Analysis Results
            </div>
            <ExportButton report={report} inputText={inputText} />
          </div>

          <RiskCard report={report} />

          {/* Tabbed detail */}
          <nav className="tabs-nav" role="tablist" aria-label="Result sections">
            {tabs.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                aria-controls={`panel-${t.id}`}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                type="button"
              >
                {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className={`tab-badge ${t.danger ? 'danger' : ''}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="card tab-card">
            {activeTab === 'findings' && (
              <div className="tab-panel" id="panel-findings" role="tabpanel">
                <div className="section-label">📋 Detection Findings</div>
                <ReasonList explanation={report.explanation} />
              </div>
            )}
            {activeTab === 'threats' && (
              <div className="tab-panel" id="panel-threats" role="tabpanel">
                <div className="section-label">🎯 Attack Pattern Classification</div>
                <AttackType attackTypes={report.attackTypes} />
              </div>
            )}
            {activeTab === 'tone' && (
              <div className="tab-panel" id="panel-tone" role="tabpanel">
                <div className="section-label">🧠 Sentiment & Tone Analysis</div>
                <SentimentPanel sentiment={report.sentiment} />
              </div>
            )}
            {activeTab === 'text' && (
              <div className="tab-panel" id="panel-text" role="tabpanel">
                <div className="section-label">🖍 Annotated Message View</div>
                <HighlightedText text={inputText} highlights={report.highlights} />
              </div>
            )}
            {activeTab === 'urls' && (
              <div className="tab-panel" id="panel-urls" role="tabpanel">
                <div className="section-label">🔗 URL & Link Analysis</div>
                <UrlList urlResult={report.urls} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── History ────────────────────────────────────────────────────────── */}
      <HistoryPanel history={history} onSelect={handleHistorySelect} />
    </>
  );
};

export default Home;
