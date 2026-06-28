const Sentiment = require('sentiment');
const analyzer = new Sentiment();

/**
 * Emotion-bearing words that amplify threat perception.
 */
const FEAR_WORDS = [
  'danger', 'threat', 'risk', 'breach', 'hack', 'stolen', 'compromised',
  'illegal', 'arrested', 'suspended', 'terminate', 'closed', 'expired',
  'blocked', 'unauthorized', 'fraud', 'criminal', 'penalty', 'fine',
];

const URGENCY_MARKERS = [
  'immediately', 'right now', 'asap', 'instant', 'hurry', 'quick',
  'deadline', 'expires', 'last chance', 'final notice', 'limited time',
  'act now', 'do not delay', 'time sensitive', 'respond within',
];

const COERCION_MARKERS = [
  'you must', 'you have to', 'required to', 'failure to', 'or else',
  'otherwise', 'consequences', 'legal action', 'we will', 'forced',
];

/**
 * Analyzes the emotional tone and coercive patterns in the text.
 */
const analyze = (text) => {
  const lower = text.toLowerCase();
  const result = analyzer.analyze(text);

  const findCount = (list) =>
    list.filter(phrase => lower.includes(phrase)).length;

  const fearCount     = findCount(FEAR_WORDS);
  const urgencyCount  = findCount(URGENCY_MARKERS);
  const coercionCount = findCount(COERCION_MARKERS);

  // Sentiment polarity: negative = threatening, positive = could be baiting
  const sentimentScore = result.score;         // raw (-N to +N)
  const comparative    = result.comparative;   // normalized per word

  // Build a threat tone score (0–100)
  let toneScore = 0;
  toneScore += Math.min(fearCount    * 12, 40);
  toneScore += Math.min(urgencyCount * 10, 30);
  toneScore += Math.min(coercionCount * 12, 30);
  // Adjust for very negative sentiment
  if (comparative < -0.5) toneScore = Math.min(toneScore + 10, 100);

  const toneLabel =
    toneScore >= 70 ? 'Highly Threatening' :
    toneScore >= 40 ? 'Moderately Threatening' :
    toneScore >= 15 ? 'Mildly Suspicious' : 'Neutral';

  return {
    score:          Math.min(toneScore, 100),
    toneLabel,
    sentimentPolarity: sentimentScore < 0 ? 'Negative' : sentimentScore > 0 ? 'Positive' : 'Neutral',
    rawSentiment:   sentimentScore,
    comparative,
    fearWords:      FEAR_WORDS.filter(w => lower.includes(w)),
    urgencyPhrases: URGENCY_MARKERS.filter(p => lower.includes(p)),
    coercionPhrases: COERCION_MARKERS.filter(p => lower.includes(p)),
    counts: { fear: fearCount, urgency: urgencyCount, coercion: coercionCount },
  };
};

module.exports = { analyze };
