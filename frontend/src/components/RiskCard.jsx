import React from 'react';

const riskMeta = (score) => {
  if (score >= 80) return { color: '#f87171', label: 'Serious threat detected',     emoji: '🚨', cssVar: '#f87171' };
  if (score >= 60) return { color: '#fb923c', label: 'Likely suspicious content',   emoji: '⚠️', cssVar: '#fb923c' };
  if (score >= 30) return { color: '#fbbf24', label: 'Some red flags found',        emoji: '🔶', cssVar: '#fbbf24' };
  return           { color: '#34d399', label: 'Looks pretty safe',             emoji: '✅', cssVar: '#34d399' };
};

const ScoreBar = ({ label, score }) => {
  const { color } = riskMeta(score);
  return (
    <div className="score-bar-row">
      <div className="score-bar-label">{label}</div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="score-bar-num" style={{ color }}>{score}</div>
    </div>
  );
};

const RiskCard = ({ report }) => {
  const { riskScore, riskLevel, explanation, keywords, urls, sentiment } = report;
  const meta = riskMeta(riskScore);
  const ts   = new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <section
      className="card risk-header-card"
      style={{ '--risk-color': meta.color }}
      aria-label={`Risk result: ${riskLevel}`}
    >
      {/* Top row — score + verdict */}
      <div className="risk-top-row">
        <div className="score-ring-wrap">
          <div
            className="score-ring"
            style={{
              borderColor: meta.color,
              boxShadow:   `0 0 18px ${meta.color}44`,
            }}
            role="img"
            aria-label={`Risk score ${riskScore} out of 100`}
          >
            <span className="score-ring-num" style={{ color: meta.color }}>{riskScore}</span>
            <span className="score-ring-denom">/100</span>
          </div>
        </div>

        <div className="risk-words">
          <div className="risk-level-label" style={{ color: meta.color }}>
            {meta.emoji} {riskLevel} Risk
          </div>
          <div className="risk-verdict">{meta.label}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 6 }}>
            Checked at {ts} · {report.inputLength.toLocaleString()} characters scanned
          </div>
        </div>
      </div>

      {/* Score breakdown bars */}
      <div className="score-bars">
        <ScoreBar label="Keywords"  score={keywords.score} />
        <ScoreBar label="URLs"      score={urls.score} />
        <ScoreBar label="Tone"      score={sentiment.score} />
      </div>

      {/* Summary verdict */}
      <blockquote
        className="risk-summary-quote"
        style={{ borderLeftColor: meta.color }}
        aria-label="Analysis summary"
      >
        {explanation.summary}
      </blockquote>
    </section>
  );
};

export default RiskCard;
