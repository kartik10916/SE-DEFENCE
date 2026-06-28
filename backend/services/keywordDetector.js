const suspiciousKeywords = require('../data/suspiciousKeywords.json');
const authorityWords     = require('../data/authorityWords.json');
const urgencyWords       = require('../data/urgencyWords.json');
const sensitiveWords     = require('../data/sensitiveWords.json');
const { escapeRegex }    = require('../utils/regex');

/**
 * Scans text for all keyword categories and returns matched terms with counts.
 */
const analyze = (text) => {
  const lower = text.toLowerCase();

  const findMatches = (wordList) =>
    wordList.filter(word =>
      new RegExp(`\\b${escapeRegex(word)}\\b`, 'i').test(lower)
    );

  const suspicious = findMatches(suspiciousKeywords.words);
  const authority  = findMatches(authorityWords.words);
  const urgency    = findMatches(urgencyWords.words);
  const sensitive  = findMatches(sensitiveWords.words);

  const totalMatches = suspicious.length + authority.length + urgency.length + sensitive.length;

  // Normalized score 0–100
  const rawScore = Math.min(
    (suspicious.length * 10) +
    (authority.length  *  6) +
    (urgency.length    *  8) +
    (sensitive.length  *  5),
    100
  );

  return {
    score:              rawScore,
    totalMatches,
    suspiciousKeywords: suspicious,
    authorityKeywords:  authority,
    urgencyKeywords:    urgency,
    sensitiveKeywords:  sensitive,
    categories: {
      suspicious: { count: suspicious.length, words: suspicious },
      authority:  { count: authority.length,  words: authority  },
      urgency:    { count: urgency.length,    words: urgency    },
      sensitive:  { count: sensitive.length,  words: sensitive  },
    },
  };
};

module.exports = { analyze };
