import React from 'react';

const TAG_META = {
  'Phishing':                { cls: 'phishing',   icon: '🎣' },
  'Urgency Manipulation':    { cls: 'urgency',    icon: '⏰' },
  'Authority Impersonation': { cls: 'authority',  icon: '👮' },
  'Pretexting':              { cls: 'pretexting', icon: '🎭' },
  'Coercion / Intimidation': { cls: 'coercion',   icon: '💢' },
  'Brand Spoofing':          { cls: 'brand',      icon: '🪞' },
  'URL Obfuscation':         { cls: 'url-obf',    icon: '🔗' },
};

const AttackType = ({ attackTypes }) => {
  if (!attackTypes?.length) {
    return (
      <p style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>
        No specific attack pattern identified.
      </p>
    );
  }

  return (
    <div>
      <div className="attack-tags">
        {attackTypes.map(type => {
          const { cls, icon } = TAG_META[type] || { cls: 'phishing', icon: '⚠️' };
          return (
            <span
              key={type}
              className={`attack-tag ${cls}`}
              aria-label={`Attack type: ${type}`}
            >
              <span aria-hidden="true">{icon}</span>
              {type}
            </span>
          );
        })}
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.6rem' }}>
        {attackTypes.length} pattern{attackTypes.length !== 1 ? 's' : ''} matched
      </p>
    </div>
  );
};

export default AttackType;
