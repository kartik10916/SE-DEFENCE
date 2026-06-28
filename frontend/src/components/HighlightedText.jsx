import React from 'react';

const LEGEND = [
  { cls: 'hl-suspicious', label: 'Suspicious', color: 'rgba(248,113,113,0.5)'  },
  { cls: 'hl-urgency',    label: 'Urgency',    color: 'rgba(251,191,36,0.45)'  },
  { cls: 'hl-authority',  label: 'Authority',  color: 'rgba(251,146,60,0.45)'  },
  { cls: 'hl-sensitive',  label: 'Sensitive',  color: 'rgba(167,139,250,0.5)'  },
  { cls: 'hl-url',        label: 'Susp. URL',  color: 'rgba(34,211,238,0.42)'  },
];

const buildSegments = (text, highlights) => {
  if (!highlights?.length) return [<span key="all">{text}</span>];

  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const out    = [];
  let cursor   = 0;

  sorted.forEach((h, i) => {
    if (h.start < cursor) return;
    if (h.start > cursor) out.push(<span key={`p${i}`}>{text.slice(cursor, h.start)}</span>);
    out.push(
      <mark
        key={`h${i}`}
        className={`hl-${h.type}`}
        title={`${h.type}: "${h.term}"`}
        aria-label={`${h.type} term: ${h.term}`}
      >
        {text.slice(h.start, h.end)}
      </mark>
    );
    cursor = h.end;
  });

  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
  return out;
};

const HighlightedText = ({ text, highlights }) => (
  <div>
    <div className="highlighted-box" role="region" aria-label="Message with highlights">
      {buildSegments(text, highlights)}
    </div>
    <div className="hl-legend" aria-label="Colour key">
      {LEGEND.map(({ cls, label, color }) => (
        <div key={cls} className="hl-legend-item">
          <div className="hl-dot" style={{ background: color }} aria-hidden="true" />
          {label}
        </div>
      ))}
    </div>
  </div>
);

export default HighlightedText;
