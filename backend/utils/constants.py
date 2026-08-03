# constants.py — Application-wide constant values.

API_VERSION = '/api/v1'

# Maximum allowed text length for analysis (characters)
MAX_TEXT_LENGTH = 10000

# History store size limit
MAX_HISTORY = 50

# Attack type labels
ATTACK_TYPES = {
    "PHISHING":          "Phishing",
    "URGENCY":           "Urgency Manipulation",
    "AUTHORITY":         "Authority Impersonation",
    "PRETEXTING":        "Pretexting",
    "COERCION":          "Coercion / Intimidation",
    "BRAND_SPOOFING":    "Brand Spoofing",
    "URL_OBFUSCATION":   "URL Obfuscation",
    "VISHING":           "Vishing (Voice Phishing)",
    "SMISHING":          "Smishing (SMS Phishing)",
}

# Risk level labels
RISK_LEVELS = {
    "LOW":      "Low",
    "MEDIUM":   "Medium",
    "HIGH":     "High",
    "CRITICAL": "Critical",
}
