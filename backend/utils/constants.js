/**
 * constants.js — Application-wide constant values.
 */

/** API version prefix */
const API_VERSION = '/api/v1';

/** Maximum allowed text length for analysis (characters) */
const MAX_TEXT_LENGTH = 10_000;

/** History store size limit */
const MAX_HISTORY = 50;

/** Attack type labels */
const ATTACK_TYPES = Object.freeze({
  PHISHING:          'Phishing',
  URGENCY:           'Urgency Manipulation',
  AUTHORITY:         'Authority Impersonation',
  PRETEXTING:        'Pretexting',
  COERCION:          'Coercion / Intimidation',
  BRAND_SPOOFING:    'Brand Spoofing',
  URL_OBFUSCATION:   'URL Obfuscation',
  VISHING:           'Vishing (Voice Phishing)',
  SMISHING:          'Smishing (SMS Phishing)',
});

/** Risk level labels */
const RISK_LEVELS = Object.freeze({
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  CRITICAL: 'Critical',
});

module.exports = { API_VERSION, MAX_TEXT_LENGTH, MAX_HISTORY, ATTACK_TYPES, RISK_LEVELS };
