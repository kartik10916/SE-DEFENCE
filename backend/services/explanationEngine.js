/**
 * explanationEngine.js
 * Generates a structured, human-readable threat explanation from all
 * detection service results.
 */

const ADVICE = {
  Phishing:              'Do not click any links. Verify the sender through official channels.',
  'Urgency Manipulation':'Ignore artificial deadlines. Legitimate orgs rarely demand instant action.',
  'Authority Impersonation': 'Verify the sender\'s identity independently before responding.',
  'Pretexting':          'Be cautious about requests that build a false narrative to extract information.',
  'Coercion / Intimidation': 'Threatening language is a manipulation tactic. Do not comply under pressure.',
  'Brand Spoofing':      'Check the exact URL — attackers mimic trusted brands with slight misspellings.',
  'URL Obfuscation':     'Never click shortened URLs in unsolicited messages — they may hide malicious destinations.',
};

/**
 * Builds a structured explanation object.
 */
const build = ({ keywordResult, urlResult, sentimentResult, riskResult }) => {
  const reasons  = [];
  const advice   = [];
  const findings = [];

  // ── Keyword findings ──────────────────────────────────────────────────────
  if (keywordResult.suspiciousKeywords.length > 0) {
    reasons.push(`Contains ${keywordResult.suspiciousKeywords.length} suspicious keyword(s): "${keywordResult.suspiciousKeywords.join('", "')}"`);
    findings.push({ category: 'Suspicious Keywords', items: keywordResult.suspiciousKeywords, severity: 'high' });
  }
  if (keywordResult.urgencyKeywords.length > 0) {
    reasons.push(`Uses urgency-inducing language: "${keywordResult.urgencyKeywords.join('", "')}"`);
    findings.push({ category: 'Urgency Keywords', items: keywordResult.urgencyKeywords, severity: 'medium' });
  }
  if (keywordResult.authorityKeywords.length > 0) {
    reasons.push(`Invokes authority/official entities: "${keywordResult.authorityKeywords.join('", "')}"`);
    findings.push({ category: 'Authority Words', items: keywordResult.authorityKeywords, severity: 'medium' });
  }
  if (keywordResult.sensitiveKeywords.length > 0) {
    reasons.push(`Requests sensitive information: "${keywordResult.sensitiveKeywords.join('", "')}"`);
    findings.push({ category: 'Sensitive Info Requests', items: keywordResult.sensitiveKeywords, severity: 'high' });
  }

  // ── URL findings ──────────────────────────────────────────────────────────
  urlResult.suspiciousUrls.forEach(u => {
    if (u.isSuspicious) {
      reasons.push(`Suspicious URL detected: "${u.url}" — ${u.reasons[0]}`);
      findings.push({ category: 'Suspicious URL', items: u.reasons, severity: 'high' });
    }
  });

  // ── Sentiment findings ────────────────────────────────────────────────────
  if (sentimentResult.fearWords.length > 0) {
    reasons.push(`Fear-inducing language detected: "${sentimentResult.fearWords.join('", "')}"`);
    findings.push({ category: 'Fear Language', items: sentimentResult.fearWords, severity: 'medium' });
  }
  if (sentimentResult.coercionPhrases.length > 0) {
    reasons.push(`Coercive phrases found: "${sentimentResult.coercionPhrases.join('", "')}"`);
    findings.push({ category: 'Coercion Phrases', items: sentimentResult.coercionPhrases, severity: 'high' });
  }

  // ── Advice based on attack types ─────────────────────────────────────────
  riskResult.attackTypes.forEach(type => {
    if (ADVICE[type]) advice.push({ type, text: ADVICE[type] });
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  let summary = '';
  if (riskResult.score >= 80) {
    summary = '🚨 This message shows strong indicators of a social engineering attack. Do NOT interact with it.';
  } else if (riskResult.score >= 60) {
    summary = '⚠️ This message contains multiple red flags typical of social engineering. Treat with extreme caution.';
  } else if (riskResult.score >= 30) {
    summary = '🟡 Some suspicious patterns detected. Verify the source before taking any action.';
  } else {
    summary = '✅ No significant threats detected. The message appears relatively safe.';
  }

  return { summary, reasons, findings, advice };
};

module.exports = { build };
