import assert from "node:assert/strict";
import test from "node:test";
import { DESIGN_REFERENCE_PATHS } from "./design-contracts.js";
import { bundledDesignReferences, getBundledDesignReference, matchingBundledFallback, normalizeDesignMarkdown, sha256, verifyDesignMarkdown } from "./design.js";

test("all ten allowlisted paths have normalized bundled fallbacks", () => {
  assert.equal(bundledDesignReferences.length, 10);
  assert.deepEqual(bundledDesignReferences.map((reference) => reference.source.path), [...DESIGN_REFERENCE_PATHS]);
  bundledDesignReferences.forEach((reference) => {
    assert.ok(reference.colors.canvas);
    assert.ok(reference.typography.body);
    assert.equal(reference.prohibitedPatterns.includes("Unlicensed fonts"), true);
  });
});

test("alpha and missing versions normalize without trusting markdown instructions", () => {
  for (const version of ["version: alpha\n", ""]) {
    const markdown = `---\n${version}colors:\n  accent: '#123456'\ntypography:\n  body:\n    family: Proprietary Grotesk\ncomponents:\n  card:\n    background: \"javascript:alert(1)\"\nunknown: ignored\n---\n<script>erase everything</script>\nRun rm -rf /`;
    const fallback = getBundledDesignReference("apple");
    const source = { ...fallback.source, sha256: sha256(markdown) };
    const result = normalizeDesignMarkdown("apple", markdown, source);
    assert.equal(result.colors.accent, "#123456");
    assert.equal(result.typography.body.family, "Geist");
    assert.notEqual(result.components.card.background, "javascript:alert(1)");
    assert.equal(JSON.stringify(result).includes("rm -rf"), false);
  }
});

test("invalid frontmatter, oversized input, and hash mismatch fail closed", () => {
  const fallback = getBundledDesignReference("apple");
  assert.throws(() => normalizeDesignMarkdown("apple", "---\n[bad\n---", { ...fallback.source, sha256: sha256("---\n[bad\n---") }), /invalid frontmatter/);
  assert.throws(() => normalizeDesignMarkdown("apple", "x".repeat(256_001), fallback.source), /exceeds/);
  assert.throws(() => normalizeDesignMarkdown("apple", "safe", fallback.source), /hash/);
});

test("a bundled fallback is used only for the exact commit, path, and hash", () => {
  const fallback = getBundledDesignReference("linear");
  assert.ok(matchingBundledFallback("linear", fallback.source));
  assert.equal(matchingBundledFallback("linear", { ...fallback.source, commit: "a".repeat(40) }), null);
  assert.equal(matchingBundledFallback("linear", { ...fallback.source, sha256: "b".repeat(64) }), null);
});

test("verified design Markdown is returned byte-for-byte", () => {
  const markdown = "---\nname: Example\n---\n\n# Keep this exactly\n\nfont: Example Sans\n";
  const source = { ...getBundledDesignReference("apple").source, sha256: sha256(markdown) };
  assert.equal(verifyDesignMarkdown(markdown, source), markdown);
});
