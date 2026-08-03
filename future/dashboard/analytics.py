import urllib.request
import json
from datetime import datetime
from typing import List, Dict, Any

# constants
RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical']
ATTACK_TYPES = [
    'Phishing', 'Urgency Manipulation', 'Authority Impersonation',
    'Pretexting', 'Coercion / Intimidation', 'Brand Spoofing', 'URL Obfuscation'
]

def compute_stats(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Computes aggregate statistics over an array of analysis reports."""
    if not reports:
        return { "count": 0, "avgScore": 0, "maxScore": 0, "minScore": 0, "highRisk": 0, "threatRate": 0.0 }

    scores = [r.get('riskScore', 0) for r in reports]
    total = len(reports)

    avg_score = round(sum(scores) / total)
    max_score = max(scores)
    min_score = min(scores)
    high_risk = sum(1 for r in reports if r.get('riskScore', 0) >= 60)
    threat_rate = round((high_risk / total) * 100, 1)

    return {
        "count":      total,
        "avgScore":   avg_score,
        "maxScore":   max_score,
        "minScore":   min_score,
        "highRisk":   high_risk,
        "threatRate": threat_rate
    }

def get_risk_distribution(reports: List[Dict[str, Any]]) -> Dict[str, int]:
    """Groups reports by risk level and returns distribution counts."""
    dist = {level: 0 for level in RISK_LEVELS}
    for r in reports:
        level = r.get('riskLevel')
        if level in dist:
            dist[level] += 1
    return dist

def get_attack_type_frequency(reports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Counts occurrences of each attack type across all reports."""
    freq = {t: 0 for t in ATTACK_TYPES}
    for r in reports:
        for t in r.get('attackTypes', []):
            if t in freq:
                freq[t] += 1

    sorted_freq = [{"type": t, "count": count} for t, count in freq.items()]
    sorted_freq.sort(key=lambda x: x['count'], reverse=True)
    return sorted_freq

def get_daily_trend(reports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Groups reports by date (YYYY-MM-DD) and computes daily average score."""
    by_date = {}
    for r in reports:
        timestamp = r.get('timestamp')
        if not timestamp or len(timestamp) < 10:
            continue
        date = timestamp[:10]  # YYYY-MM-DD
        if date not in by_date:
            by_date[date] = {"scores": [], "count": 0}
        by_date[date]["scores"].append(r.get('riskScore', 0))
        by_date[date]["count"] += 1

    trend = []
    for date, data in by_date.items():
        trend.append({
            "date": date,
            "count": data["count"],
            "avgScore": round(sum(data["scores"]) / data["count"])
        })
    trend.sort(key=lambda x: x['date'])
    return trend

def get_top_threats(reports: List[Dict[str, Any]], n: int = 10) -> List[Dict[str, Any]]:
    """Returns the top N most dangerous reports."""
    sorted_reports = sorted(reports, key=lambda x: x.get('riskScore', 0), reverse=True)
    return sorted_reports[:n]

def get_keyword_frequency(reports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Computes keyword frequency across all reports."""
    freq = {}
    for r in reports:
        keywords = r.get('keywords', {})
        all_words = (
            keywords.get('suspiciousKeywords', []) +
            keywords.get('urgencyKeywords', []) +
            keywords.get('authorityKeywords', [])
        )
        for w in all_words:
            freq[w] = freq.get(w, 0) + 1

    sorted_freq = [{"word": word, "count": count} for word, count in freq.items()]
    sorted_freq.sort(key=lambda x: x['count'], reverse=True)
    return sorted_freq

def generate_dashboard_data(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generates a complete analytics dashboard data object."""
    return {
        "generatedAt":        datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "stats":              compute_stats(reports),
        "riskDistribution":   get_risk_distribution(reports),
        "attackTypeFrequency": get_attack_type_frequency(reports),
        "dailyTrend":         get_daily_trend(reports),
        "topThreats":         get_top_threats(reports, 10),
        "keywordFrequency":   get_keyword_frequency(reports)[:20]
    }

def fetch_and_analyze(api_base: str = 'http://localhost:5000/api') -> Dict[str, Any]:
    """Fetches history from backend and builds dashboard data."""
    url = f"{api_base}/history"
    try:
        with urllib.request.urlopen(url) as response:
            if response.status != 200:
                raise Exception(f"API returned status {response.status}")
            raw_data = response.read().decode('utf-8')
            data = json.loads(raw_data)
            history = data.get('history', [])
            return generate_dashboard_data(history)
    except Exception as e:
        raise Exception(f"Failed to fetch analytics data: {e}")
