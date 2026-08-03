import React, { useState, useEffect } from 'react';

/* ── Risk metadata ─────────────────────────────────────────────────────────── */
const RISK_META = {
  Critical: { color: '#ef4444', textColor: '#fca5a5', bg: 'rgba(239,68,68,0.1)',  bd: 'rgba(239,68,68,0.3)',  title: 'Critical Threat Detected' },
  High:     { color: '#f97316', textColor: '#fdba74', bg: 'rgba(249,115,22,0.1)', bd: 'rgba(249,115,22,0.3)', title: 'High-Risk Content Identified' },
  Medium:   { color: '#eab308', textColor: '#fde047', bg: 'rgba(234,179,8,0.1)',  bd: 'rgba(234,179,8,0.28)', title: 'Suspicious Content Detected' },
  Low:      { color: '#22c55e', textColor: '#86efac', bg: 'rgba(34,197,94,0.1)',  bd: 'rgba(34,197,94,0.28)', title: 'Low Risk Assessment' },
};

const getAccent = (level) => RISK_META[level] || RISK_META.Low;

/* ── Animated number counter ───────────────────────────────────────────────── */
const AnimatedNum = ({ target, color, className }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame;
    const duration = 800;
    const start = performance.now();
    const step = (now) => {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3); // ease-out cubic
      setVal(Math.round(eased * target));
      if (pct < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <span className={className} style={{ color }}>{val}</span>;
};

/* ── SVG Gauge ─────────────────────────────────────────────────────────────── */
const RADIUS = 30;
const CIRC   = 2 * Math.PI * RADIUS;

const GaugeRing = ({ score, color }) => {
  const offset = CIRC - (score / 100) * CIRC;
  return (
    <div className="gauge-wrap">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle className="gauge-track" cx="38" cy="38" r={RADIUS} />
        <circle
          className="gauge-fill"
          cx="38" cy="38" r={RADIUS}
          stroke={color}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="gauge-text">
        <AnimatedNum target={score} color={color} className="gauge-score" />
        <span className="gauge-label">/ 100</span>
      </div>
    </div>
  );
};

/* ── Sub-bar ───────────────────────────────────────────────────────────────── */
const subColor = (s) => s >= 70 ? '#ef4444' : s >= 50 ? '#f97316' : s >= 30 ? '#eab308' : '#22c55e';

const SubBar = ({ label, score }) => {
  const c = subColor(score);
  return (
    <div className="sub-bar-row">
      <div className="sub-bar-label">{label}</div>
      <div className="sub-bar-track">
        <div
          className="sub-bar-fill"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${c}55, ${c})` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="sub-bar-num" style={{ color: c }}>{score}</div>
    </div>
  );
};

/* ── RiskCard ──────────────────────────────────────────────────────────────── */
const RiskCard = ({ report }) => {
  const { riskScore, riskLevel, explanation, keywords, urls, sentiment, confidence } = report;
  const accent = getAccent(riskLevel);
  const ts = new Date(report.timestamp).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const totalKeywords = keywords.suspiciousKeywords.length +
    keywords.urgencyKeywords.length +
    keywords.authorityKeywords.length;

  return (
    <section
      className="card risk-header-card"
      style={{ '--risk-accent': accent.color }}
      aria-label={`Threat assessment: ${riskLevel} risk, score ${riskScore}`}
    >
      <div className="risk-header-inner">

        {/* ── Top metric row ── */}
        <div className="risk-metrics-row">
          <GaugeRing score={riskScore} color={accent.color} />

          <div className="risk-identity">
            <div className="risk-level-badge"
              style={{ background: accent.bg, borderColor: accent.bd, color: accent.textColor }}
            >
              {riskLevel} Risk
            </div>
            <div className="risk-title">{accent.title}</div>
            <div className="risk-meta">
              <span>{ts}</span>
              <span className="risk-meta-sep">·</span>
              <span>{report.inputLength.toLocaleString()} chars</span>
              <span className="risk-meta-sep">·</span>
              <span>{report.analysisTime}ms</span>
            </div>
          </div>

          <div className="metric-divider" />

          {/* Confidence */}
          <div className="metric-stat">
            <div className="metric-stat-num" style={{ color: accent.color }}>
              {confidence?.percentage || 0}%
            </div>
            <div className="metric-stat-lbl">Confidence</div>
          </div>

          <div className="metric-divider" />

          {/* Keywords */}
          <div className="metric-stat">
            <div className="metric-stat-num" style={{ color: totalKeywords > 0 ? accent.color : '#22c55e' }}>
              {totalKeywords}
            </div>
            <div className="metric-stat-lbl">Keywords</div>
          </div>

          <div className="metric-divider" />

          {/* URLs */}
          <div className="metric-stat">
            <div className="metric-stat-num" style={{ color: urls.suspiciousUrls.length > 0 ? '#ef4444' : '#22c55e' }}>
              {urls.totalUrls}
            </div>
            <div className="metric-stat-lbl">Links</div>
          </div>
        </div>

        {/* ── Sub-scores ── */}
        <div className="sub-bars">
          <SubBar label="Keyword Score"   score={keywords.score} />
          <SubBar label="URL Score"       score={urls.score} />
          <SubBar label="Sentiment Score" score={sentiment.score} />
        </div>

        {/* ── Confidence badge ── */}
        {confidence && (
          <div className="confidence-row">
            <div className="confidence-badge" style={{
              background: confidence.label === 'Very High' ? 'rgba(34,197,94,0.1)' :
                          confidence.label === 'High' ? 'rgba(59,130,246,0.1)' :
                          'rgba(234,179,8,0.1)',
              borderColor: confidence.label === 'Very High' ? 'rgba(34,197,94,0.3)' :
                           confidence.label === 'High' ? 'rgba(59,130,246,0.3)' :
                           'rgba(234,179,8,0.3)',
            }}>
              <span className="confidence-label">{confidence.label} Confidence</span>
              <span className="confidence-basis">{confidence.basis}</span>
            </div>
          </div>
        )}

        {/* ── Summary ── */}
        <div className="risk-callout">
          <span className="callout-icon" aria-hidden="true">
            {riskLevel === 'Low' ? '✓' : riskLevel === 'Medium' ? '!' : '⚠'}
          </span>
          <span>{explanation.summary}</span>
        </div>
      </div>
    </section>
  );
};

export default RiskCard;
