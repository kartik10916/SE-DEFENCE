import re
from urllib.parse import urlparse
from typing import Dict, Any
from utils.regex import URL_REGEX, IP_URL_REGEX

# 30+ known URL shortener domains
SHORTENER_DOMAINS = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly',
    'rebrand.ly', 'short.link', 'bl.ink', 'is.gd', 'v.gd', 'shorte.st',
    'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc', 'lnkd.in', 'soo.gd',
    'clck.ru', 's.id', 'rotf.lol', 'bc.vc', 'ouo.io', 'adf.ly',
    'shorturl.me', 'trib.al', 'mcaf.ee', 'yourls.org', 'hyperurl.co',
    'urlz.fr', 'surl.li', 'cut.ly',
]

# 25+ suspicious TLDs commonly used in phishing
SUSPICIOUS_TLDS = [
    '.tk', '.ml', '.ga', '.cf', '.pw', '.xyz', '.top', '.click', '.loan',
    '.work', '.buzz', '.cam', '.icu', '.monster', '.quest', '.rest',
    '.surf', '.gq', '.fit', '.bar', '.life', '.online', '.site',
    '.store', '.fun', '.space',
]

# 15+ deceptive brand impersonation patterns
DECEPTIVE_PATTERNS = [
    re.compile(r'paypa1', re.IGNORECASE),
    re.compile(r'arnazon', re.IGNORECASE),
    re.compile(r'g00gle', re.IGNORECASE),
    re.compile(r'faceb00k', re.IGNORECASE),
    re.compile(r'micros0ft', re.IGNORECASE),
    re.compile(r'secure.*login', re.IGNORECASE),
    re.compile(r'login.*secure', re.IGNORECASE),
    re.compile(r'verify.*account', re.IGNORECASE),
    re.compile(r'account.*verify', re.IGNORECASE),
    re.compile(r'update.*billing', re.IGNORECASE),
    re.compile(r'confirm.*password', re.IGNORECASE),
    re.compile(r'reset.*credential', re.IGNORECASE),
    re.compile(r'app1e\.com', re.IGNORECASE),
    re.compile(r'netfl1x', re.IGNORECASE),
    re.compile(r'1nstagram', re.IGNORECASE),
    re.compile(r'wh4tsapp', re.IGNORECASE),
    re.compile(r'bankof.*america', re.IGNORECASE),
    re.compile(r'wells.*farg0', re.IGNORECASE),
    re.compile(r'chasebank', re.IGNORECASE),
]

# Suspicious path keywords (login pages etc.)
SUSPICIOUS_PATHS = [
    re.compile(r'/login', re.IGNORECASE),
    re.compile(r'/signin', re.IGNORECASE),
    re.compile(r'/verify', re.IGNORECASE),
    re.compile(r'/secure', re.IGNORECASE),
    re.compile(r'/account', re.IGNORECASE),
    re.compile(r'/update', re.IGNORECASE),
    re.compile(r'/confirm', re.IGNORECASE),
    re.compile(r'/billing', re.IGNORECASE),
    re.compile(r'/password', re.IGNORECASE),
    re.compile(r'/reset', re.IGNORECASE),
    re.compile(r'/webscr', re.IGNORECASE),
    re.compile(r'/auth', re.IGNORECASE),
    re.compile(r'/recover', re.IGNORECASE),
]

# Homoglyph / punycode detection
PUNYCODE_RE = re.compile(r'xn--', re.IGNORECASE)
MIXED_SCRIPT_RE = re.compile(r'[а-яА-Я].*[a-zA-Z]|[a-zA-Z].*[а-яА-Я]')

def analyze(text: str) -> Dict[str, Any]:
    """Extracts and analyses all URLs found in the text."""
    found_urls = URL_REGEX.findall(text) or []
    suspicious_urls = []
    max_score = 0

    for url in found_urls:
        reasons = []
        url_score = 0

        try:
            url_to_parse = url if (url.startswith('http://') or url.startswith('https://') or url.startswith('ftp://')) else f"http://{url}"
            parsed = urlparse(url_to_parse)
            hostname = (parsed.hostname or "").lower()
            full_path = parsed.path + (f"?{parsed.query}" if parsed.query else "")

            if not hostname:
                raise ValueError("No hostname")

            # 1. IP-based URL
            if IP_URL_REGEX.match(hostname):
                reasons.append('Uses raw IP address instead of a domain name — common in phishing')
                url_score += 30

            # 2. URL shorteners
            if any(hostname.endswith(d) for d in SHORTENER_DOMAINS):
                reasons.append('URL shortener detected — real destination is hidden')
                url_score += 25

            # 3. Suspicious TLDs
            tld = '.' + hostname.split('.')[-1]
            if tld in SUSPICIOUS_TLDS:
                reasons.append(f'Suspicious top-level domain: {tld} — commonly used in phishing')
                url_score += 20

            # 4. Deceptive brand patterns
            for pattern in DECEPTIVE_PATTERNS:
                if pattern.search(hostname):
                    reasons.append('URL contains brand impersonation pattern (typosquatting)')
                    url_score += 25

            # 5. HTTP (not HTTPS)
            # note: parsed.scheme will be 'http' if we prepended it or if it originally was 'http'
            # If the original url didn't start with any scheme, we default to http, so scheme is 'http'
            # But let's check if the original URL had https:// or not.
            if url.startswith('http://') or not (url.startswith('https://') or url.startswith('ftp://')):
                reasons.append('Non-secure HTTP — legitimate sites use HTTPS')
                url_score += 10

            # 6. Excessive subdomains (> 3 parts, e.g. a.b.c.d.com has parts split by '.' -> 5 parts)
            parts = hostname.split('.')
            if len(parts) > 4:
                reasons.append('Excessive subdomains — possible subdomain spoofing')
                url_score += 15

            # 7. Long URLs
            if len(url) > 100:
                reasons.append('Unusually long URL — may obscure the real destination')
                url_score += 10

            # 8. Suspicious path keywords
            path_hits = [p for p in SUSPICIOUS_PATHS if p.search(full_path)]
            if len(path_hits) > 0:
                reasons.append('Suspicious path contains login/verification keywords')
                url_score += 12

            # 9. Punycode (internationalized domain spoofing)
            if PUNYCODE_RE.search(hostname):
                reasons.append('Punycode domain detected — possible homoglyph attack')
                url_score += 30

            # 10. Mixed script detection
            if MIXED_SCRIPT_RE.search(url):
                reasons.append('Mixed character scripts — possible visual spoofing')
                url_score += 25

            # 11. Excessive URL parameters
            param_count = len(re.findall(r'[&?]', parsed.query or ""))
            if param_count > 5:
                reasons.append(f'Excessive URL parameters ({param_count}) — may contain tracking/exploit data')
                url_score += 10

            # 12. @ symbol in URL (credentials injection)
            if '@' in url and not url.startswith('mailto:'):
                reasons.append('Contains @ symbol — may trick browser into ignoring the real domain')
                url_score += 20

        except Exception:
            reasons.append('Malformed URL — could not be parsed')
            url_score += 20

        normalized_url_score = min(url_score, 100)
        max_score = max(max_score, normalized_url_score)

        suspicious_urls.append({
            "url":          url,
            "score":        normalized_url_score,
            "reasons":      reasons,
            "isSuspicious": normalized_url_score > 0
        })

    return {
        "score":          min(max_score, 100),
        "totalUrls":      len(found_urls),
        "suspiciousUrls": suspicious_urls,
        "allUrls":        found_urls
    }
