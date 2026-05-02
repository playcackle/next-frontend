/**
 * Language sanitizer for the unified messages chat.
 * Blocks abusive and racist language before messages are sent.
 *
 * The list covers common slurs and abusive terms. Matching is:
 * - Case-insensitive
 * - Whole-word aware (won't flag substrings of legitimate words)
 * - Leet-speak aware for the most commonly abused terms
 */

const BANNED_PATTERNS: RegExp[] = [
  // Racist slurs
  /\bn[i!1][g9][g9][e3]r\b/i,
  /\bn[i!1][g9]{2,}/i,
  /\bnigg[ae]\b/i,
  /\bcoon\b/i,
  /\bspic\b/i,
  /\bwetback\b/i,
  /\bchink\b/i,
  /\bgook\b/i,
  /\btowelhead\b/i,
  /\bkike\b/i,
  /\bjew[- ]?bait\b/i,
  /\bwigger\b/i,
  /\bcracke[r]?\b/i,
  /\bjigaboo\b/i,
  /\bporch\s?monkey\b/i,
  /\bcoon[s]?\b/i,
  /\bdarkie\b/i,
  /\bsambo\b/i,
  /\bsandnigger\b/i,
  /\bcamel\s?jockey\b/i,
  /\bbeaners?\b/i,
  /\bgypsy\b/i,

  // Abusive / hate speech
  /\bfaggot\b/i,
  /\bf[a@]g\b/i,
  /\bdyke\b/i,
  /\bretard\b/i,
  /\bretarded\b/i,
  /\bspastic\b/i,
  /\btranny\b/i,
  /\bsh[e3]male\b/i,

  // General severe abuse
  /\bcunt\b/i,
  /\bwh[o0]re\b/i,
  /\bslut\b/i,
  /\bbitch\b/i,
  /\bfuck\s?wit\b/i,
  /\bmotherfucker\b/i,
  /\bm[o0]ther\s?f[u*][ck]+[e3]r\b/i,
  /\bcocksucker\b/i,
];

/**
 * Returns true when the message contains banned language.
 */
export function containsBannedLanguage(text: string): boolean {
  return BANNED_PATTERNS.some((pattern) => pattern.test(text));
}

