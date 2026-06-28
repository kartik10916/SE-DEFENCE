import React, { useState, useCallback } from 'react';
import TextInput       from '../components/TextInput';
import AnalyzeButton   from '../components/AnalyzeButton';
import RiskCard        from '../components/RiskCard';
import ReasonList      from '../components/ReasonList';
import HighlightedText from '../components/HighlightedText';
import AttackType      from '../components/AttackType';
import { analyzeText } from '../api/analyzeAPI';

/* ── Loading step animation ────────────────────────────────────────────────── */
const STEPS = [
  { id: 'kw',   label: 'Scanning for suspicious keywords…' },
  { id: 'url',  label: 'Checking all links in the message…' },
  { id: 'tone', label: 'Reading the emotional tone…'        },
  { id: 'calc', label: 'Calculating your risk score…'       },
];

const LoadingCard = ({ step }) => (
  <div className="card empty-card loading-card">
    <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>🔍</div>
    <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem', fontSize: '1rem' }}>
      Analyzing your message
    </div>
    <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
      This usually takes less than a second
    </div>
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

/* ── Sentiment panel ───────────────────────────────────────────────────────── */
const toneClass = (label = '') => {
  if (label.includes('Highly'))    return 'high';
  if (label.includes('Moderately'))return 'moderate';
  if (label.includes('Mildly'))    return 'mild';
  return 'neutral';
};

const KwGroup = ({ label, words, color }) => {
  if (!words?.length) return null;
  return (
    <div className="kw-group">
      <div className="kw-group-label">{label}</div>
      <div className="kw-pills">
        {words.map(w => (
          <span
            key={w}
            className="kw-pill"
            style={{
              background:   `${color}14`,
              borderColor:  `${color}40`,
              color,
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
};

const SentimentPanel = ({ sentiment }) => {
  const cls = toneClass(sentiment.toneLabel);
  return (
    <div>
      <div className={`tone-badge ${cls}`}>
        {cls === 'neutral'  ? '😌' :
         cls === 'mild'     ? '😟' :
         cls === 'moderate' ? '😠' : '😱'} {sentiment.toneLabel}
      </div>
      <KwGroup label="Fear language"     words={sentiment.fearWords}      color="#f87171" />
      <KwGroup label="Urgency phrases"   words={sentiment.urgencyPhrases}  color="#fbbf24" />
      <KwGroup label="Coercion phrases"  words={sentiment.coercionPhrases} color="#fb923c" />
      {!sentiment.fearWords.length && !sentiment.urgencyPhrases.length && !sentiment.coercionPhrases.length && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
          The tone of this message seems normal — no threatening language detected.
        </p>
      )}
    </div>
  );
};

/* ── URL cards ─────────────────────────────────────────────────────────────── */
const UrlList = ({ urlResult }) => {
  if (!urlResult.allUrls.length) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>No URLs found in this message.</p>;
  }

  return (
    <div className="url-list">
      {urlResult.suspiciousUrls.map((u, i) => {
        const color = u.score >= 60 ? '#f87171' : u.score >= 30 ? '#fbbf24' : '#34d399';
        return (
          <div key={i} className="url-entry">
            <div className="url-entry-top">
              <span className="url-entry-href">{u.url}</span>
              <span
                className="url-score-badge"
                style={{
                  background: `${color}18`,
                  borderColor: `${color}40`,
                  color,
                }}
              >
                {u.score}/100
              </span>
            </div>
            {u.reasons.length > 0 && (
              <div className="url-findings">
                {u.reasons.map((r, j) => (
                  <div key={j} className="url-finding-line">{r}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Tab definitions ───────────────────────────────────────────────────────── */
const buildTabs = (report) => [
  {
    id:    'findings',
    label: 'Findings',
    badge: report.explanation.reasons.length,
    danger: report.explanation.reasons.length > 0,
  },
  {
    id:    'threats',
    label: 'Attack Types',
    badge: report.attackTypes.length,
    danger: report.attackTypes.length > 0,
  },
  {
    id:    'tone',
    label: 'Tone',
    badge: null,
  },
  {
    id:    'text',
    label: 'Highlighted',
    badge: report.highlights.length,
  },
  {
    id:    'urls',
    label: 'Links',
    badge: report.urls.totalUrls,
    danger: report.urls.score >= 40,
  },
];

/* ── Main Home page ─────────────────────────────────────────────────────────── */
const Home = () => {
  const [inputText, setInputText] = useState('');
  const [report,    setReport]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [loadStep,  setLoadStep]  = useState(0);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('findings');

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setLoadStep(0);
    setError(null);
    setReport(null);

    // Animate loading steps
    const stepTimer = setInterval(() => {
      setLoadStep(s => Math.min(s + 1, STEPS.length - 1));
    }, 320);

    try {
      const result = await analyzeText(inputText);
      clearInterval(stepTimer);
      setReport(result);
      setActiveTab('findings');
      setTimeout(() => {
        document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (err) {
      clearInterval(stepTimer);
      const msg = err.response?.data?.error || err.message || 'Could not reach the backend. Make sure the server is running on port 5000.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  const handleClear = () => {
    setInputText('');
    setReport(null);
    setError(null);
  };

  const tabs = report ? buildTabs(report) : [];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <header className="hero">
        <div className="hero-tag">
          <span aria-hidden="true">🛡️</span> Threat Detector
        </div>
        <h1>
          Is this message <em>trying to trick you?</em>
        </h1>
        <p className="hero-desc">
          Paste any email, SMS, or chat message below. We'll tell you if it's a
          phishing attempt, scam, or manipulation tactic — in plain English.
        </p>
        <div className="hero-features" aria-label="Features">
          {['🎣 Phishing', '⏰ Urgency traps', '👮 Fake authority', '🔗 Dodgy links', '💬 Threatening tone'].map(f => (
            <span key={f} className="feature-pill">{f}</span>
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
          <span className="error-icon" aria-hidden="true">❌</span>
          <div>
            <strong>Something went wrong.</strong><br />
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
          <div className="empty-title">Nothing checked yet</div>
          <div className="empty-body">
            Paste a suspicious message above and click{' '}
            <strong style={{ color: 'var(--text-2)' }}>Check for Threats</strong>.
            We'll scan it instantly and explain what we find in plain English.
          </div>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {report && (
        <div className="results-section" id="results-top" aria-live="polite">

          {/* Risk overview */}
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

          <div className="card" style={{ padding: 'var(--space-5)' }}>
            {/* Findings tab */}
            {activeTab === 'findings' && (
              <div className="tab-panel" id="panel-findings" role="tabpanel">
                <ReasonList explanation={report.explanation} />
              </div>
            )}

            {/* Attack types tab */}
            {activeTab === 'threats' && (
              <div className="tab-panel" id="panel-threats" role="tabpanel">
                <div className="section-label" style={{ marginBottom: 'var(--space-4)' }}>
                  🎯 What kind of attack is this?
                </div>
                <AttackType attackTypes={report.attackTypes} />
              </div>
            )}

            {/* Tone tab */}
            {activeTab === 'tone' && (
              <div className="tab-panel" id="panel-tone" role="tabpanel">
                <div className="section-label" style={{ marginBottom: 'var(--space-4)' }}>
                  🧠 Emotional tone analysis
                </div>
                <SentimentPanel sentiment={report.sentiment} />
              </div>
            )}

            {/* Highlighted text tab */}
            {activeTab === 'text' && (
              <div className="tab-panel" id="panel-text" role="tabpanel">
                <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
                  🖍️ Colour-coded threat zones
                </div>
                <HighlightedText text={inputText} highlights={report.highlights} />
              </div>
            )}

            {/* URLs tab */}
            {activeTab === 'urls' && (
              <div className="tab-panel" id="panel-urls" role="tabpanel">
                <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
                  🔗 Links found in the message
                </div>
                <UrlList urlResult={report.urls} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
