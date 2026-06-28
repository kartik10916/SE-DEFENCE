const { URL_REGEX, SHORTENER_REGEX, IP_URL_REGEX } = require('../utils/regex');

/** Known URL shortener domains */
const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly',
  'rebrand.ly', 'short.link', 'bl.ink', 'is.gd', 'v.gd', 'shorte.st',
];

/** Common legitimate TLDs; anything else raises suspicion */
const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.pw', '.xyz', '.top', '.click', '.loan'];

/** Patterns in the URL body that indicate deception */
const DECEPTIVE_PATTERNS = [
  /paypa1/i, /arnazon/i, /g00gle/i, /faceb00k/i, /micros0ft/i,
  /secure.*login/i, /login.*secure/i, /verify.*account/i, /account.*verify/i,
  /update.*billing/i, /confirm.*password/i, /reset.*credential/i,
];

/**
 * Extracts and analyses all URLs found in the text.
 */
const analyze = (text) => {
  const foundUrls = text.match(URL_REGEX) || [];
  const suspiciousUrls = [];
  let score = 0;

  foundUrls.forEach(url => {
    const reasons = [];
    let urlScore = 0;

    try {
      const parsed = new URL(url.startsWith('http') ? url : `http://${url}`);
      const hostname = parsed.hostname.toLowerCase();

      // IP-based URL
      if (IP_URL_REGEX.test(hostname)) {
        reasons.push('IP address used instead of domain name');
        urlScore += 30;
      }

      // URL shorteners
      if (SHORTENER_DOMAINS.some(d => hostname.endsWith(d))) {
        reasons.push('URL shortener detected — destination is hidden');
        urlScore += 25;
      }

      // Suspicious TLDs
      if (SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld))) {
        reasons.push(`Suspicious top-level domain: ${hostname.split('.').pop()}`);
        urlScore += 20;
      }

      // Deceptive patterns in URL
      DECEPTIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(url)) {
          reasons.push('URL contains deceptive brand impersonation pattern');
          urlScore += 25;
        }
      });

      // HTTP (not HTTPS)
      if (parsed.protocol === 'http:') {
        reasons.push('Non-secure HTTP connection');
        urlScore += 10;
      }

      // Excessive subdomains (> 3 parts)
      const parts = hostname.split('.');
      if (parts.length > 4) {
        reasons.push('Excessive subdomains — possible subdomain spoofing');
        urlScore += 15;
      }

      // Long URLs often obscure destination
      if (url.length > 100) {
        reasons.push('Unusually long URL may obscure the real destination');
        urlScore += 10;
      }

    } catch {
      reasons.push('Malformed URL — could not be parsed');
      urlScore += 20;
    }

    const normalizedUrlScore = Math.min(urlScore, 100);
    score = Math.max(score, normalizedUrlScore);

    suspiciousUrls.push({
      url,
      score: normalizedUrlScore,
      reasons,
      isSuspicious: normalizedUrlScore > 0,
    });
  });

  return {
    score:         Math.min(score, 100),
    totalUrls:     foundUrls.length,
    suspiciousUrls,
    allUrls:       foundUrls,
  };
};

module.exports = { analyze };
