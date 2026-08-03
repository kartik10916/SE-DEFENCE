from typing import Dict, Any

ADVICE = {
    'Phishing': {
        'text': 'Do not click any links. Verify the sender through official channels before responding.',
        'severity': 'Critical'
    },
    'Urgency Manipulation': {
        'text': 'Ignore artificial deadlines. Legitimate organizations rarely demand instant action via email or SMS.',
        'severity': 'High'
    },
    'Authority Impersonation': {
        'text': "Verify the sender's identity independently. Contact the organization directly using known official channels.",
        'severity': 'High'
    },
    'Pretexting': {
        'text': 'Be cautious of requests that build a false narrative to extract information. Cross-verify all claims.',
        'severity': 'Medium'
    },
    'Coercion / Intimidation': {
        'text': 'Threatening language is a manipulation tactic. Do not comply under pressure. Report the message.',
        'severity': 'Critical'
    },
    'Brand Spoofing': {
        'text': 'Inspect the exact URL character by character. Attackers mimic trusted brands with subtle misspellings.',
        'severity': 'High'
    },
    'URL Obfuscation': {
        'text': 'Never click shortened or obfuscated URLs in unsolicited messages. They may redirect to malicious sites.',
        'severity': 'High'
    },
    'Data Harvesting': {
        'text': 'This message appears to systematically request personal data. Never provide sensitive information via email.',
        'severity': 'Critical'
    },
}

def build(keyword_result: Dict[str, Any], url_result: Dict[str, Any], sentiment_result: Dict[str, Any], risk_result: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a structured, professional threat explanation from all detection service results."""
    reasons = []
    advice = []
    findings = []

    # ── Keyword findings ──────────────────────────────────────────────────────
    suspicious = keyword_result.get('suspiciousKeywords', [])
    if len(suspicious) > 0:
        reasons.append(f'Detected {len(suspicious)} suspicious keyword(s) commonly associated with phishing: "' + '", "'.join(suspicious[:5]) + '"')
        findings.append({
            'category': 'Suspicious Keywords',
            'items': suspicious,
            'severity': 'high',
            'count': len(suspicious)
        })

    urgency_kw = keyword_result.get('urgencyKeywords', [])
    if len(urgency_kw) > 0:
        reasons.append(f'Contains {len(urgency_kw)} urgency trigger(s) designed to pressure the recipient: "' + '", "'.join(urgency_kw[:4]) + '"')
        findings.append({
            'category': 'Urgency Keywords',
            'items': urgency_kw,
            'severity': 'medium',
            'count': len(urgency_kw)
        })

    authority_kw = keyword_result.get('authorityKeywords', [])
    if len(authority_kw) > 0:
        reasons.append(f'References {len(authority_kw)} authority/official entity keyword(s) to establish false credibility: "' + '", "'.join(authority_kw[:4]) + '"')
        findings.append({
            'category': 'Authority Words',
            'items': authority_kw,
            'severity': 'medium',
            'count': len(authority_kw)
        })

    sensitive_kw = keyword_result.get('sensitiveKeywords', [])
    if len(sensitive_kw) > 0:
        reasons.append(f'Requests {len(sensitive_kw)} type(s) of sensitive information: "' + '", "'.join(sensitive_kw[:4]) + '"')
        findings.append({
            'category': 'Sensitive Info Requests',
            'items': sensitive_kw,
            'severity': 'high',
            'count': len(sensitive_kw)
        })

    # ── URL findings ──────────────────────────────────────────────────────────
    for u in url_result.get('suspiciousUrls', []):
        if u.get('isSuspicious'):
            url_str = u.get('url', '')
            truncated_url = f"{url_str[:60]}..." if len(url_str) > 60 else url_str
            reasons.append(f'Suspicious URL identified: "{truncated_url}" (risk score: {u.get("score")}/100)')
            findings.append({
                'category': 'Suspicious URL',
                'items': u.get('reasons', []),
                'severity': 'high' if u.get('score', 0) >= 50 else 'medium',
                'count': len(u.get('reasons', []))
            })

    # ── Sentiment findings ────────────────────────────────────────────────────
    fear_w = sentiment_result.get('fearWords', [])
    if len(fear_w) > 0:
        reasons.append(f'Uses {len(fear_w)} fear-inducing term(s) to create anxiety: "' + '", "'.join(fear_w[:4]) + '"')
        findings.append({
            'category': 'Fear Language',
            'items': fear_w,
            'severity': 'medium',
            'count': len(fear_w)
        })

    coercion_p = sentiment_result.get('coercionPhrases', [])
    if len(coercion_p) > 0:
        reasons.append(f'Contains {len(coercion_p)} coercive phrase(s) intended to force compliance: "' + '", "'.join(coercion_p[:3]) + '"')
        findings.append({
            'category': 'Coercion Phrases',
            'items': coercion_p,
            'severity': 'high',
            'count': len(coercion_p)
        })

    # ── Advice based on attack types ─────────────────────────────────────────
    for attack_type in risk_result.get('attackTypes', []):
        if attack_type in ADVICE:
            advice.append({
                'type': attack_type,
                'text': ADVICE[attack_type]['text'],
                'severity': ADVICE[attack_type]['severity']
            })

    # ── Professional summary ──────────────────────────────────────────────────
    score = risk_result.get('score', 0)
    total_findings = len(findings)

    if score >= 80:
        summary = f"This message exhibits {total_findings} strong indicators of a social engineering attack. The combination of suspicious keywords, deceptive URLs, and manipulative language patterns strongly suggests malicious intent. Do not interact with this content."
    elif score >= 60:
        summary = f"Analysis identified {total_findings} concerning patterns typical of social engineering tactics. The message contains elements designed to deceive or manipulate the recipient. Exercise extreme caution."
    elif score >= 30:
        summary = f"{total_findings} suspicious element(s) detected in this message. While not conclusive, these patterns warrant caution. Verify the source independently before taking any action."
    else:
        summary = "No significant threat indicators were detected across keyword, URL, and sentiment analysis. This message appears to be legitimate, though standard security practices should always be maintained."

    return {
        "summary": summary,
        "reasons": reasons,
        "findings": findings,
        "advice": advice,
        "totalFindings": total_findings
    }
