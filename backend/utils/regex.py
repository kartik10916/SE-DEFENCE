import re

# Matches most common URL formats (http, https, ftp, bare domains).
URL_REGEX = re.compile(
    r'(?:https?://|ftp://|www\.)[^\s"\'<>\])}]+|(?:[a-zA-Z0-9-]+\.(?:com|net|org|io|co|gov|edu|info|biz|tk|ml|ga|cf|pw|xyz|top|click|loan)(?:/[^\s"\'<>\])}]*)?)',
    re.IGNORECASE
)

# Matches IP-address based hostnames (e.g., 192.168.1.1).
IP_URL_REGEX = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$')

# Matches URL shortener patterns as part of a URL.
SHORTENER_REGEX = re.compile(
    r'(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|buff\.ly|rebrand\.ly|short\.link|bl\.ink|is\.gd|v\.gd|shorte\.st)/',
    re.IGNORECASE
)

def escape_regex(val: str) -> str:
    """Escapes special regex characters in a string."""
    return re.escape(val)
