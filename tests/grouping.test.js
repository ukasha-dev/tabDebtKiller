import { getClusterKey, cluster, keyToColor, capitalize } from "../src/grouping.js";

describe("getClusterKey", () => {
  test("strips www and returns primary subdomain", () => {
    expect(getClusterKey("https://www.github.com/user/repo")).toBe("github");
  });
  test("handles no www", () => {
    expect(getClusterKey("https://notion.so/page")).toBe("notion");
  });
  test("returns null for invalid URL", () => {
    expect(getClusterKey("not-a-url")).toBeNull();
  });
});

describe("cluster", () => {
  const makeTabs = (urls) => urls.map((url, i) => ({ id: i, url }));

  test("groups tabs with same hostname", () => {
    const tabs = makeTabs([
      "https://github.com/a",
      "https://github.com/b",
      "https://notion.so/c",
    ]);
    const groups = cluster(tabs);
    expect(groups.has("github")).toBe(true);
    expect(groups.get("github").length).toBe(2);
  });

  test("excludes single-tab groups (FR-003)", () => {
    const tabs = makeTabs(["https://github.com/a", "https://notion.so/b"]);
    const groups = cluster(tabs);
    expect(groups.size).toBe(0);
  });

  test("handles empty array", () => {
    expect(cluster([]).size).toBe(0);
  });
});

describe("keyToColor", () => {
  test("returns a valid color string", () => {
    const valid = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
    expect(valid).toContain(keyToColor("github"));
  });
  test("same key always returns same color (deterministic)", () => {
    expect(keyToColor("github")).toBe(keyToColor("github"));
  });
});

describe("capitalize", () => {
  test("capitalizes first letter", () => {
    expect(capitalize("github")).toBe("Github");
  });
});
