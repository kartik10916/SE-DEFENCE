const { RISK_THRESHOLDS, SCORE_WEIGHTS } = require('../config/config');

/**
 * Maps keyword category hits to attack type labels.
 */
const detectAttackTypes = ({ keywordResult, urlResult, sentimentResult }) => {
  const types = new Set();
  const k = keywordResult;
  const s = sentimentResult;

  if (k.suspiciousKeywords.length > 0 || urlResult.suspiciousUrls.length > 0) {
    types.add('Phishing');
  }
  if (k.urgencyKeywords.length >= 2 || s.counts.urgency >= 2) {
    types.add('Urgency Manipulation');
  }
  if (k.authorityKeywords.length >= 1) {
    types.add('Authority Impersonation');
  }
  if (k.sensitiveKeywords.length >= 2) {
    types.add('Pretexting');
  }
  if (s.counts.coercion >= 1) {
    types.add('Coercion / Intimidation');
  }
  if (urlResult.suspiciousUrls.some(u => u.reasons.some(r => r.includes('impersonation')))) {
    types.add('Brand Spoofing');
  }
  if (urlResult.suspiciousUrls.some(u => u.reasons.some(r => r.includes('shortener')))) {
    types.add('URL Obfuscation');
  }

  return [...types];
};

/**
 * Combines individual service scores into a weighted composite risk score.
 * Returns score (0–100), level label, color, and detected attack types.
 */
const calculate = ({ keywordResult, urlResult, sentimentResult }) => {
  const w = SCORE_WEIGHTS;

  const composite = Math.round(
    (keywordResult.score  * w.keyword)   +
    (urlResult.score      * w.url)       +
    (sentimentResult.score * w.sentiment) +
    (keywordResult.categories.sensitive.count * 5 * w.sensitive)
  );

  const score = Math.min(Math.max(composite, 0), 100);

  // Determine level
  let level = 'Low';
  let color = RISK_THRESHOLDS.LOW.color;

  for (const [key, threshold] of Object.entries(RISK_THRESHOLDS)) {
    if (score >= threshold.min && score <= threshold.max) {
      level = threshold.label;
      color = threshold.color;
      break;
    }
  }

  const attackTypes = detectAttackTypes({ keywordResult, urlResult, sentimentResult });

  return { score, level, color, attackTypes };
};

module.exports = { calculate };
