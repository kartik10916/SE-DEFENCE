import time
import random
import re
from typing import Dict, Any, List
from services import keyword_detector, url_detector, sentiment_detector, risk_calculator, explanation_engine

# In-memory history store (max 100 entries)
analysis_history: List[Dict[str, Any]] = []

def to_base36(num: int) -> str:
    """Helper to convert an integer to a base-36 string."""
    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    if num == 0:
        return "0"
    res = []
    while num > 0:
        num, rem = divmod(num, 36)
        res.append(chars[rem])
    return "".join(reversed(res))

def generate_request_id() -> str:
    """Generates a request ID similar to JS: req_timestamp36_random36."""
    now_ms = int(time.time() * 1000)
    now_b36 = to_base36(now_ms)
    rand_chars = "".join(random.choices("0123456789abcdefghijklmnopqrstuvwxyz", k=6))
    return f"req_{now_b36}_{rand_chars}"

def sanitize_input(text: str) -> str:
    """Strips HTML tags and normalises whitespace for safe processing."""
    # Strip HTML
    text = re.sub(r'<[^>]*>', '', text)
    # Strip HTML entities
    text = re.sub(r'&[a-z]+;', ' ', text, flags=re.IGNORECASE)
    # Normalise line breaks
    text = re.sub(r'[\r\n]+', '\n', text)
    # Collapse multiple spaces
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()

def build_highlights(text: str, keyword_result: Dict[str, Any], url_result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Build character-level highlight ranges for the frontend."""
    highlights = []
    lower = text.lower()

    def add_highlight(term: str, h_type: str, severity: str):
        if not term:
            return
        term_lower = term.lower()
        idx = lower.find(term_lower)
        while idx != -1:
            highlights.append({
                "start": idx,
                "end": idx + len(term),
                "term": term,
                "type": h_type,
                "severity": severity
            })
            idx = lower.find(term_lower, idx + 1)

    for k in keyword_result.get('suspiciousKeywords', []):
        add_highlight(k, 'suspicious', 'high')
    for k in keyword_result.get('urgencyKeywords', []):
        add_highlight(k, 'urgency', 'medium')
    for k in keyword_result.get('authorityKeywords', []):
        add_highlight(k, 'authority', 'medium')
    for k in keyword_result.get('sensitiveKeywords', []):
        add_highlight(k, 'sensitive', 'low')
    for u in url_result.get('suspiciousUrls', []):
        add_highlight(u.get('url', ''), 'url', 'high')

    # Sort by start position
    highlights.sort(key=lambda x: x['start'])
    return highlights

def get_history_list() -> List[Dict[str, Any]]:
    """Returns the analysis history."""
    return analysis_history

def analyze_text(text: str, scan_counter_inc_callback=None) -> Dict[str, Any]:
    """Runs all detection services, calculates risk, generates report, and stores in history."""
    start_time = time.time()
    request_id = generate_request_id()

    trimmed = sanitize_input(text)
    if len(trimmed) < 5:
        raise ValueError('Text is too short to analyze (minimum 5 characters).')

    # Run detection services
    keyword_result = keyword_detector.analyze(trimmed)
    url_result = url_detector.analyze(trimmed)
    sentiment_result = sentiment_detector.analyze(trimmed)

    # Calculate composite risk score
    risk_result = risk_calculator.calculate(keyword_result, url_result, sentiment_result)

    # Build human-readable explanation
    explanation = explanation_engine.build(keyword_result, url_result, sentiment_result, risk_result)

    elapsed_ms = int((time.time() - start_time) * 1000)

    # Increment scan counter
    if scan_counter_inc_callback:
        scan_counter_inc_callback()

    report = {
        "id": request_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "inputLength": len(trimmed),
        "analysisTime": elapsed_ms,
        "riskScore": risk_result["score"],
        "riskLevel": risk_result["level"],
        "riskColor": risk_result["color"],
        "confidence": risk_result["confidence"],
        "attackTypes": risk_result["attackTypes"],
        "keywords": keyword_result,
        "urls": url_result,
        "sentiment": sentiment_result,
        "explanation": explanation,
        "highlights": build_highlights(trimmed, keyword_result, url_result)
    }

    # Store in history
    history_entry = {**report, "inputPreview": trimmed[:120]}
    analysis_history.insert(0, history_entry)
    if len(analysis_history) > 100:
        analysis_history.pop()

    return {
        "report": report,
        "requestId": request_id,
        "elapsedMs": elapsed_ms
    }
