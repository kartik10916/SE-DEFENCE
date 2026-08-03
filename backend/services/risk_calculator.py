from typing import Dict, Any, List
from config import RISK_THRESHOLDS, SCORE_WEIGHTS
from utils.score_helper import js_round

def detect_attack_types(keyword_result: Dict[str, Any], url_result: Dict[str, Any], sentiment_result: Dict[str, Any]) -> List[str]:
    """Maps keyword category hits to attack type labels."""
    types = []
    k = keyword_result
    s = sentiment_result
    u_list = url_result.get('suspiciousUrls', [])

    if len(k.get('suspiciousKeywords', [])) > 0 or any(u.get('score', 0) >= 25 for u in u_list):
        types.append('Phishing')
    if len(k.get('urgencyKeywords', [])) >= 2 or s.get('counts', {}).get('urgency', 0) >= 2:
        types.append('Urgency Manipulation')
    if len(k.get('authorityKeywords', [])) >= 1:
        types.append('Authority Impersonation')
    if len(k.get('sensitiveKeywords', [])) >= 2:
        types.append('Pretexting')
    if s.get('counts', {}).get('coercion', 0) >= 1:
        types.append('Coercion / Intimidation')
    if any(any('impersonation' in reason for reason in u.get('reasons', [])) for u in u_list):
        types.append('Brand Spoofing')
    if any(any('shortener' in reason or 'obfusc' in reason for reason in u.get('reasons', [])) for u in u_list):
        types.append('URL Obfuscation')
    # New: Data harvesting
    if len(k.get('sensitiveKeywords', [])) >= 3 and len(k.get('urgencyKeywords', [])) >= 1:
        types.append('Data Harvesting')

    # Keep insertion order while removing duplicates (simulating JS Set behavior converted to array)
    seen = set()
    unique_types = []
    for t in types:
        if t not in seen:
            seen.add(t)
            unique_types.append(t)
    return unique_types

def calculate_confidence(keyword_result: Dict[str, Any], url_result: Dict[str, Any], sentiment_result: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates how confident we are in the assessment based on number of triggered signals."""
    signals = 0

    if len(keyword_result.get('suspiciousKeywords', [])) > 0:
        signals += 1
    if len(keyword_result.get('urgencyKeywords', [])) > 0:
        signals += 1
    if len(keyword_result.get('authorityKeywords', [])) > 0:
        signals += 1
    if len(keyword_result.get('sensitiveKeywords', [])) > 0:
        signals += 1
    if any(u.get('score', 0) > 0 for u in url_result.get('suspiciousUrls', [])):
        signals += 1
    if sentiment_result.get('counts', {}).get('fear', 0) > 0:
        signals += 1
    if sentiment_result.get('counts', {}).get('urgency', 0) > 0:
        signals += 1
    if sentiment_result.get('counts', {}).get('coercion', 0) > 0:
        signals += 1

    if signals == 0:
        return {"percentage": 95, "label": "High", "basis": "No threat signals detected"}
    if signals <= 2:
        return {"percentage": 55 + signals * 10, "label": "Moderate", "basis": f"{signals} signal(s) detected"}
    if signals <= 4:
        return {"percentage": 75 + signals * 3, "label": "High", "basis": f"{signals} signals corroborate"}
    return {"percentage": min(92 + signals, 99), "label": "Very High", "basis": f"{signals} independent signals confirm"}

def calculate(keyword_result: Dict[str, Any], url_result: Dict[str, Any], sentiment_result: Dict[str, Any]) -> Dict[str, Any]:
    """Combines individual service scores into a weighted composite risk score."""
    w = SCORE_WEIGHTS

    composite = js_round(
        (keyword_result.get('score', 0) * w['keyword']) +
        (url_result.get('score', 0) * w['url']) +
        (sentiment_result.get('score', 0) * w['sentiment']) +
        (keyword_result.get('categories', {}).get('sensitive', {}).get('count', 0) * 5 * w['sensitive'])
    )

    # Combo bonuses
    has_keywords = keyword_result.get('score', 0) > 15
    has_susp_urls = url_result.get('score', 0) > 15
    has_bad_tone = sentiment_result.get('score', 0) > 20

    if has_keywords and has_susp_urls:
        composite += 8
    if has_keywords and has_bad_tone:
        composite += 5
    if has_susp_urls and has_bad_tone:
        composite += 5
    if has_keywords and has_susp_urls and has_bad_tone:
        composite += 7

    score = min(max(composite, 0), 100)

    # Determine level
    level = 'Low'
    color = RISK_THRESHOLDS['LOW']['color']

    for key, threshold in RISK_THRESHOLDS.items():
        if threshold['min'] <= score <= threshold['max']:
            level = threshold['label']
            color = threshold['color']
            break

    attack_types = detect_attack_types(keyword_result, url_result, sentiment_result)
    confidence = calculate_confidence(keyword_result, url_result, sentiment_result)

    return {
        "score": score,
        "level": level,
        "color": color,
        "attackTypes": attack_types,
        "confidence": confidence
    }
