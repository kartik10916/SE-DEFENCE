// test-backend.js — Quick smoke test for backend services
const keywordDetector   = require('./services/keywordDetector');
const urlDetector       = require('./services/urlDetector');
const sentimentDetector = require('./services/sentimentDetector');
const riskCalculator    = require('./services/riskCalculator');
const explanationEngine = require('./services/explanationEngine');

const sampleText = `URGENT: Your PayPal account has been compromised! 
Click here immediately to verify your credentials and avoid permanent suspension: 
http://secure-paypa1.tk/verify?token=abc123. 
Failure to act within 24 hours will result in account closure and legal action.`;

console.log('='.repeat(60));
console.log('SE Defense Backend — Smoke Test');
console.log('='.repeat(60));
console.log('\nInput text:\n', sampleText.slice(0, 80) + '...\n');

const keywordResult   = keywordDetector.analyze(sampleText);
const urlResult       = urlDetector.analyze(sampleText);
const sentimentResult = sentimentDetector.analyze(sampleText);
const riskResult      = riskCalculator.calculate({ keywordResult, urlResult, sentimentResult });
const explanation     = explanationEngine.build({ keywordResult, urlResult, sentimentResult, riskResult });

console.log('📊 Keyword Score:  ', keywordResult.score);
console.log('   Suspicious:     ', keywordResult.suspiciousKeywords);
console.log('   Urgency:        ', keywordResult.urgencyKeywords);
console.log('   Authority:      ', keywordResult.authorityKeywords);
console.log('\n🌐 URL Score:      ', urlResult.score);
console.log('   Suspicious URLs:', urlResult.suspiciousUrls.map(u => u.url + ' → ' + u.reasons[0]));
console.log('\n😨 Sentiment Score:', sentimentResult.score);
console.log('   Tone Label:     ', sentimentResult.toneLabel);
console.log('   Fear Words:     ', sentimentResult.fearWords);
console.log('\n🎯 RISK SCORE:     ', riskResult.score, '/', 100);
console.log('   Level:          ', riskResult.level);
console.log('   Attack Types:   ', riskResult.attackTypes);
console.log('\n📝 Summary:        ', explanation.summary);
console.log('\n✅ Smoke test PASSED');
