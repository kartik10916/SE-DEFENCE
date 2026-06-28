import React from 'react';

const ICON_MAP = {
  suspicious: { emoji: '🚨', label: 'Suspicious phrase' },
  urgency:    { emoji: '⏰', label: 'Urgency trigger'   },
  authority:  { emoji: '👮', label: 'Authority claim'   },
  sensitive:  { emoji: '🔑', label: 'Sensitive request' },
  url:        { emoji: '🔗', label: 'Suspicious URL'    },
  fear:       { emoji: '😨', label: 'Fear language'     },
  coercion:   { emoji: '💢', label: 'Coercive phrasing' },
  default:    { emoji: '⚠️', label: 'Red flag'          },
};

const categoryToKey = (cat = '') => {
  const c = cat.toLowerCase();
  if (c.includes('suspic'))   return 'suspicious';
  if (c.includes('urgency'))  return 'urgency';
  if (c.includes('authority'))return 'authority';
  if (c.includes('sensitive'))return 'sensitive';
  if (c.includes('url'))      return 'url';
  if (c.includes('fear'))     return 'fear';
  if (c.includes('coercion')) return 'coercion';
  return 'default';
};

const ADVICE_ICONS = {
  'Phishing':                '🎣',
  'Urgency Manipulation':    '⏰',
  'Authority Impersonation': '👮',
  'Pretexting':              '🎭',
  'Coercion / Intimidation': '💢',
  'Brand Spoofing':          '🪞',
  'URL Obfuscation':         '🔗',
};

const ReasonList = ({ explanation }) => {
  const { reasons = [], findings = [], advice = [] } = explanation;

  if (reasons.length === 0) {
    return (
      <p style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>
        Nothing suspicious was found in this message. 👍
      </p>
    );
  }

  return (
    <div>
      {/* What we found */}
      <div className="section-label">🔍 What we found</div>
      <div className="findings-list">
        {reasons.map((reason, i) => {
          const key  = categoryToKey(findings[i]?.category);
          const info = ICON_MAP[key];
          return (
            <div key={i} className="finding-item">
              <div className="finding-icon-wrap" aria-hidden="true">{info.emoji}</div>
              <div className="finding-body">
                <div className="finding-title">{info.label}</div>
                <div className="finding-desc">{reason}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* What you should do */}
      {advice.length > 0 && (
        <>
          <div className="divider" />
          <div className="section-label">💡 What you should do</div>
          <div className="advice-list">
            {advice.map((a, i) => (
              <div key={i} className="advice-card">
                <span className="advice-icon" aria-hidden="true">
                  {ADVICE_ICONS[a.type] || '💡'}
                </span>
                <div className="advice-body">
                  <div className="advice-heading">{a.type}</div>
                  <div className="advice-text">{a.text}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReasonList;
