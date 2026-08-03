import math
from typing import List, Dict

def clamp(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Clamps a value between min_val and max_val."""
    return min(max(value, min_val), max_val)

def score_to_color(score: float) -> str:
    """Returns a CSS-compatible color string for a given score."""
    if score >= 80:
        return '#ef4444'   # red   — critical
    if score >= 60:
        return '#f97316'   # orange — high
    if score >= 30:
        return '#f59e0b'   # amber  — medium
    return '#22c55e'        # green  — low

def score_to_label(score: float) -> str:
    """Returns a text label for a given score."""
    if score >= 80:
        return 'Critical'
    if score >= 60:
        return 'High'
    if score >= 30:
        return 'Medium'
    return 'Low'

def js_round(val: float) -> int:
    """Replicates JavaScript's Math.round for positive numbers."""
    return math.floor(val + 0.5)

def weighted_average(items: List[Dict[str, float]]) -> int:
    """Calculates a weighted average of sub-scores.
    Each item in list is expected to have 'score' and 'weight'.
    """
    total_weight = sum(item['weight'] for item in items)
    if total_weight == 0:
        return 0
    weighted = sum(item['score'] * item['weight'] for item in items)
    return js_round(weighted / total_weight)
