/**
 * regex.js — Shared regular expressions used across services.
 */

/** Matches most common URL formats (http, https, ftp, bare domains). */
const URL_REGEX = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s"'<>\])}]+|(?:[a-zA-Z0-9-]+\.(?:com|net|org|io|co|gov|edu|info|biz|tk|ml|ga|cf|pw|xyz|top|click|loan)(?:\/[^\s"'<>\])}]*)?)/gi;

/** Matches IP-address based hostnames (e.g., 192.168.1.1). */
const IP_URL_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

/** Matches URL shortener patterns as part of a URL. */
const SHORTENER_REGEX = /(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|buff\.ly|rebrand\.ly|short\.link|bl\.ink|is\.gd|v\.gd|shorte\.st)\//i;

/**
 * Escapes special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { URL_REGEX, IP_URL_REGEX, SHORTENER_REGEX, escapeRegex };
