import os
import json
import re
from typing import Dict, Any

# Resolve absolute path to data directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def load_words(filename: str) -> list:
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('words', [])

# Load lists once at startup
suspicious_keywords = load_words('suspiciousKeywords.json')
authority_words = load_words('authorityWords.json')
urgency_words = load_words('urgencyWords.json')
sensitive_words = load_words('sensitiveWords.json')

def analyze(text: str) -> Dict[str, Any]:
    """Scans text for all keyword categories and returns matched terms with counts."""
    lower = text.lower()

    def find_matches(word_list: list) -> list:
        matches = []
        for word in word_list:
            # Replicates JS: new RegExp(`\\b${escapeRegex(word)}\\b`, 'i').test(lower)
            pattern = rf"\b{re.escape(word)}\b"
            if re.search(pattern, lower, re.IGNORECASE):
                matches.append(word)
        return matches

    suspicious = find_matches(suspicious_keywords)
    authority = find_matches(authority_words)
    urgency = find_matches(urgency_words)
    sensitive = find_matches(sensitive_words)

    total_matches = len(suspicious) + len(authority) + len(urgency) + len(sensitive)

    # Normalized score 0–100
    raw_score = min(
        (len(suspicious) * 10) +
        (len(authority) * 6) +
        (len(urgency) * 8) +
        (len(sensitive) * 5),
        100
    )

    return {
        "score":              raw_score,
        "totalMatches":       total_matches,
        "suspiciousKeywords": suspicious,
        "authorityKeywords":  authority,
        "urgencyKeywords":    urgency,
        "sensitiveKeywords":  sensitive,
        "categories": {
            "suspicious": {"count": len(suspicious), "words": suspicious},
            "authority":  {"count": len(authority),  "words": authority},
            "urgency":    {"count": len(urgency),    "words": urgency},
            "sensitive":  {"count": len(sensitive),  "words": sensitive},
        }
    }
