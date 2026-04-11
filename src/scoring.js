/**
 * Tokenizes a string into lowercase words (3+ chars, alpha only).
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length >= 3);
}

/**
 * Scores a tab candidate against a query using keyword overlap.
 * @param {string} query - user input text
 * @param {{ title?: string, url?: string, description?: string }} candidate
 * @returns {number} number of matching tokens
 */
export function score(query, candidate) {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return 0;

  const candidateText = [candidate.title, candidate.url, candidate.description]
    .filter(Boolean)
    .join(" ");
  const candidateTokens = new Set(tokenize(candidateText));

  let matches = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) matches++;
  }
  return matches;
}

/**
 * Ranks candidates by score descending, returns top N above threshold.
 * @param {string} query
 * @param {Array<{title?: string, url?: string, description?: string, [key: string]: any}>} candidates
 * @param {number} threshold - minimum score to include (default 2)
 * @param {number} topN - max results (default 3)
 * @returns {Array<{candidate: object, score: number}>}
 */
export function rankCandidates(query, candidates, threshold = 2, topN = 3) {
  return candidates
    .map((c) => ({ candidate: c, score: score(query, c) }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
