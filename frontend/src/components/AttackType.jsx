import React from 'react';

const TAG_META = {
  'Phishing':                { cls: 'phishing',   icon: '🎣', desc: 'Credential harvesting attempt'      },
  'Urgency Manipulation':    { cls: 'urgency',    icon: '⏰', desc: 'Artificial time pressure applied'    },
  'Authority Impersonation': { cls: 'authority',  icon: '👮', desc: 'Fake authority figure used'         },
  'Pretexting':              { cls: 'pretexting', icon: '🎭', desc: 'Fabricated scenario detected'       },
  'Coercion / Intimidation': { cls: 'coercion',   icon: '💢', desc: 'Threatening language present'       },
  'Brand Spoofing':          { cls: 'brand',      icon: '🪞', desc: 'Legitimate brand being impersonated'},
  'URL Obfuscation':         { cls: 'url-obf',    icon: '🔗', desc: 'Deceptive link structure found'     },
};

const AttackType = ({ attackTypes }) => {
  if (!attackTypes?.length) {
    return (
      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
        No specific attack patterns identified.
      </p>
    );
  }

  return (
    <div>
      <div className="attack-tags-grid">
        {attackTypes.map(type => {
          const { cls, icon, desc } = TAG_META[type] || { cls: 'phishing', icon: '⚠️', desc: '' };
          return (
            <div
              key={type}
              className={`attack-tag-card ${cls}`}
              aria-label={`Attack type: ${type}`}
            >
              <span className="attack-tag-icon" aria-hidden="true">{icon}</span>
              <div>
                <div className="attack-tag-name">{type}</div>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'var(--sp-4)' }}>
        {attackTypes.length} attack vector{attackTypes.length !== 1 ? 's' : ''} identified in this message.
      </p>
    </div>
  );
};

export default AttackType;
