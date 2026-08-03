import os
import json
import re
from typing import Dict, Any

# Resolve absolute path to data directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def tokenize(input_str: str) -> list:
    """Remove special characters and return an array of tokens (words). Replicates sentiment JS tokenizer."""
    if input_str is None:
        input_str = ""
    # Lowercase
    val = input_str.lower()
    # Replace newlines with spaces
    val = val.replace('\n', ' ')
    # Replace punctuation characters with spaces
    val = re.sub(r'[.,\/#!?$%\^&\*;:{}=_`\"~()]', ' ', val)
    # Collapse 2+ spaces to 1 space
    val = re.sub(r'\s\s+', ' ', val)
    # Trim
    val = val.strip()
    # Split
    if val == "":
        return [""]
    return val.split(' ')

def load_sentiment_data():
    """Load labels, emojis and negators from local JSON files."""
    with open(os.path.join(DATA_DIR, 'sentiment_labels.json'), 'r', encoding='utf-8') as f:
        labels = json.load(f)
    with open(os.path.join(DATA_DIR, 'sentiment_emojis.json'), 'r', encoding='utf-8') as f:
        emojis = json.load(f)
    with open(os.path.join(DATA_DIR, 'sentiment_negators.json'), 'r', encoding='utf-8') as f:
        negators = json.load(f)
    
    # Merge emojis into labels (as in JS language-processor.js)
    labels.update(emojis)
    return labels, negators

# Load dictionaries
LABELS, NEGATORS = load_sentiment_data()

def analyze_sentiment_raw(phrase: str) -> Dict[str, Any]:
    """Performs lexer-based sentiment analysis matching JS sentiment package."""
    tokens = tokenize(phrase)
    score = 0
    words = []
    positive = []
    negative = []
    calculation = []

    # Iterate over tokens backwards to match JS order
    for i in range(len(tokens) - 1, -1, -1):
        obj = tokens[i]
        if obj not in LABELS:
            continue
        words.append(obj)

        token_score = LABELS[obj]
        # Replicate negator scoring strategy
        if i > 0:
            prev_token = tokens[i - 1]
            if prev_token in NEGATORS:
                token_score = -token_score

        if token_score > 0:
            positive.append(obj)
        elif token_score < 0:
            negative.append(obj)

        score += token_score
        calculation.append({obj: token_score})

    return {
        "score":       score,
        "comparative": score / len(tokens) if len(tokens) > 0 else 0.0,
        "calculation": calculation,
        "tokens":      tokens,
        "words":       words,
        "positive":    positive,
        "negative":    negative
    }

# 50+ fear-inducing words
FEAR_WORDS = [
    'danger', 'threat', 'risk', 'breach', 'hack', 'stolen', 'compromised',
    'illegal', 'arrested', 'suspended', 'terminate', 'closed', 'expired',
    'blocked', 'unauthorized', 'fraud', 'criminal', 'penalty', 'fine',
    'warning', 'alert', 'violation', 'infected', 'malware', 'virus',
    'spyware', 'ransomware', 'lawsuit', 'prosecution', 'jeopardize',
    'vulnerable', 'exposed', 'leaked', 'identity theft', 'warrant',
    'seized', 'confiscated', 'investigated', 'surveillance', 'restricted',
    'revoked', 'cancelled', 'deactivated', 'locked', 'disabled',
    'compromising', 'incriminating', 'threatening', 'devastating', 'severe',
    'critical', 'emergency', 'alarming',
]

# 50+ urgency markers
URGENCY_MARKERS = [
    'immediately', 'right now', 'asap', 'instant', 'hurry', 'quick',
    'deadline', 'expires', 'last chance', 'final notice', 'limited time',
    'act now', 'do not delay', 'time sensitive', 'respond within',
    'within 24 hours', 'within 48 hours', 'today only', 'right away',
    'as soon as possible', "don't wait", 'must be completed', "before it's too late",
    'time is running out', 'offer expires', 'limited offer', 'only hours left',
    'expiring soon', 'running out', 'clock is ticking', 'ends today',
    'final warning', 'last reminder', "don't miss", 'closing soon',
    'immediate action', 'urgent action', 'no delay', 'without delay',
    'at your earliest', 'prompt attention', 'time-critical',
    'urgent response', 'must respond', 'final opportunity', 'now or never',
    'critical deadline', 'overdue', 'past due', 'delinquent',
]

# 40+ coercion markers
COERCION_MARKERS = [
    'you must', 'you have to', 'required to', 'failure to', 'or else',
    'otherwise', 'consequences', 'legal action', 'we will', 'forced',
    'comply', 'mandatory', 'obligated', 'non-compliance', 'penalized',
    'no choice', 'demanded', 'compelled', "if you don't", 'if you fail',
    'account will be', 'will be suspended', 'will be terminated',
    'will be prosecuted', 'will be reported', 'face charges',
    'held responsible', 'held liable', 'take action against',
    'disciplinary action', 'enforce', 'escalate', 'notify authorities',
    'court order', 'subpoena', 'investigation', 'permanent ban',
    'irreversible', 'cannot be undone', 'final decision',
]

def analyze(text: str) -> Dict[str, Any]:
    """Analyzes the emotional tone and coercive patterns in the text."""
    lower = text.lower()
    result = analyze_sentiment_raw(text)

    def find_matches(word_list):
        return [phrase for phrase in word_list if phrase in lower]

    fear_matches = find_matches(FEAR_WORDS)
    urgency_matches = find_matches(URGENCY_MARKERS)
    coercion_matches = find_matches(COERCION_MARKERS)

    fear_count = len(fear_matches)
    urgency_count = len(urgency_matches)
    coercion_count = len(coercion_matches)

    sentiment_score = result['score']
    comparative = result['comparative']

    # Build a threat tone score (0–100)
    tone_score = 0
    tone_score += min(fear_count * 10, 40)
    tone_score += min(urgency_count * 8, 30)
    tone_score += min(coercion_count * 10, 30)

    # Adjust for very negative sentiment
    if comparative < -0.5:
        tone_score = min(tone_score + 10, 100)
    if comparative < -1.0:
        tone_score = min(tone_score + 5, 100)

    # Intensity per category (0–100)
    fear_intensity = min(fear_count * 15, 100)
    urgency_intensity = min(urgency_count * 12, 100)
    coercion_intensity = min(coercion_count * 18, 100)

    if tone_score >= 70:
        tone_label = 'Highly Threatening'
    elif tone_score >= 40:
        tone_label = 'Moderately Threatening'
    elif tone_score >= 15:
        tone_label = 'Mildly Suspicious'
    else:
        tone_label = 'Neutral'

    sentiment_polarity = 'Neutral'
    if sentiment_score < 0:
        sentiment_polarity = 'Negative'
    elif sentiment_score > 0:
        sentiment_polarity = 'Positive'

    return {
        "score":             min(tone_score, 100),
        "toneLabel":         tone_label,
        "toneScore":         min(tone_score, 100),
        "sentimentPolarity": sentiment_polarity,
        "rawSentiment":      sentiment_score,
        "comparative":       comparative,
        "fearWords":         fear_matches,
        "urgencyPhrases":    urgency_matches,
        "coercionPhrases":   coercion_matches,
        "counts":    {"fear": fear_count, "urgency": urgency_count, "coercion": coercion_count},
        "intensity": {"fear": fear_intensity, "urgency": urgency_intensity, "coercion": coercion_intensity}
    }
