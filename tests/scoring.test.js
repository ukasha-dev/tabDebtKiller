import { tokenize, score, rankCandidates } from "../src/scoring.js";

describe("tokenize", () => {
  test("splits on non-word chars and lowercases", () => {
    expect(tokenize("Webpack Config")).toEqual(["webpack", "config"]);
  });
  test("filters tokens shorter than 3 chars", () => {
    expect(tokenize("a bb ccc")).toEqual(["ccc"]);
  });
  test("handles empty string", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("score", () => {
  test("counts matching tokens (FR-027)", () => {
    const result = score("webpack config", { title: "Webpack Configuration Guide", url: "https://webpack.js.org" });
    expect(result).toBeGreaterThanOrEqual(2);
  });
  test("returns 0 for no matches", () => {
    expect(score("python django", { title: "React Hooks Guide" })).toBe(0);
  });
  test("returns 0 for short query", () => {
    expect(score("ab", { title: "anything" })).toBe(0);
  });
});

describe("rankCandidates", () => {
  const candidates = [
    { title: "Webpack Config Guide", url: "https://webpack.js.org/config" },
    { title: "React Hooks", url: "https://react.dev/hooks" },
    { title: "Webpack Loaders", url: "https://webpack.js.org/loaders" },
    { title: "Unrelated Page", url: "https://example.com" },
  ];

  test("returns only candidates above threshold (FR-029)", () => {
    const results = rankCandidates("webpack config", candidates, 2, 3);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.score).toBeGreaterThanOrEqual(2));
  });

  test("limits to topN results (FR-030)", () => {
    const results = rankCandidates("webpack", candidates, 1, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  test("sorts by score descending", () => {
    const results = rankCandidates("webpack config", candidates, 1, 5);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});
