# test_backend.py — Quick smoke test for python backend services
from services import keyword_detector, url_detector, sentiment_detector, risk_calculator, explanation_engine

sample_text = (
    "URGENT: Your PayPal account has been compromised! \n"
    "Click here immediately to verify your credentials and avoid permanent suspension: \n"
    "http://secure-paypa1.tk/verify?token=abc123. \n"
    "Failure to act within 24 hours will result in account closure and legal action."
)

print('=' * 60)
print('SE Defense Backend (Python) — Smoke Test')
print('=' * 60)
print('\nInput text:\n', sample_text[:80] + '...\n')

keyword_result = keyword_detector.analyze(sample_text)
url_result = url_detector.analyze(sample_text)
sentiment_result = sentiment_detector.analyze(sample_text)
risk_result = risk_calculator.calculate(keyword_result, url_result, sentiment_result)
explanation = explanation_engine.build(keyword_result, url_result, sentiment_result, risk_result)

print('[KW] Keyword Score:  ', keyword_result['score'])
print('   Suspicious:     ', keyword_result['suspiciousKeywords'])
print('   Urgency:        ', keyword_result['urgencyKeywords'])
print('   Authority:      ', keyword_result['authorityKeywords'])
print('\n[URL] URL Score:      ', url_result['score'])
print('   Suspicious URLs:', [u['url'] + ' -> ' + u['reasons'][0] for u in url_result['suspiciousUrls']])
print('\n[SENT] Sentiment Score:', sentiment_result['score'])
print('   Tone Label:     ', sentiment_result['toneLabel'])
print('   Fear Words:     ', sentiment_result['fearWords'])
print('\n[RISK] RISK SCORE:     ', risk_result['score'], '/', 100)
print('   Level:          ', risk_result['level'])
print('   Attack Types:   ', risk_result['attackTypes'])
print('\n[SUMM] Summary:        ', explanation['summary'])

# Validate results against JS baselines
assert keyword_result['score'] == 58, f"Expected keyword score 58, got {keyword_result['score']}"
assert url_result['score'] == 67, f"Expected URL score 67, got {url_result['score']}"
assert sentiment_result['score'] == 46, f"Expected sentiment score 46, got {sentiment_result['score']}"
assert risk_result['score'] == 75, f"Expected risk score 75, got {risk_result['score']}"
assert len(risk_result['attackTypes']) == 5, f"Expected 5 attack types, got {len(risk_result['attackTypes'])}"

print('\n[OK] Python backend smoke test PASSED successfully!')
