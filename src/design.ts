import { createHash } from "node:crypto";
import matter from "gray-matter";
import {
  DESIGN_REFERENCE_PATHS,
  DESIGN_REPOSITORY,
  designDefaults,
  type ComponentStyle,
  type DesignId,
  type DesignReferenceV1,
  type TypographyToken,
} from "./core.js";

export const BUNDLED_DESIGN_COMMIT = "8147538b4226ae41e2487a9179e3bcc1f68e8554";

const metadata: Record<DesignId, { displayName: string; path: DesignReferenceV1["source"]["path"]; hash: string; tags: [string, string, string]; colors: Record<string, string> }> = {
  apple: { displayName: "Apple", path: DESIGN_REFERENCE_PATHS[0], hash: "83fbc614443a9b3d7569e9956a43e7b8740f9d0f939f58b8154f7a7cec3002b2", tags: ["precise", "spacious", "product-led"], colors: { canvas: "#f5f5f7", surface: "#ffffff", ink: "#1d1d1f", muted: "#6e6e73", accent: "#0071e3" } },
  airbnb: { displayName: "Airbnb", path: DESIGN_REFERENCE_PATHS[1], hash: "add34130d67209ad105346d60fe2b290728b9711683969db4b7760e29477a5fe", tags: ["warm", "friendly", "photographic"], colors: { canvas: "#ffffff", surface: "#f7f7f7", ink: "#222222", muted: "#717171", accent: "#ff385c" } },
  nike: { displayName: "Nike", path: DESIGN_REFERENCE_PATHS[2], hash: "d2a3d363665839e2ddc15c91b8a9f3e92b1962ff55a7ca5d964ab3bb88b8186c", tags: ["bold", "editorial", "athletic"], colors: { canvas: "#f5f5f5", surface: "#ffffff", ink: "#111111", muted: "#6d6d6d", accent: "#ff5a1f" } },
  stripe: { displayName: "Stripe", path: DESIGN_REFERENCE_PATHS[3], hash: "5c8806b7dd3e0c2554ccba9d1e2a7c78e7c6e50e44fcf6ff5daea6026f8a9ed9", tags: ["technical", "gradient", "polished"], colors: { canvas: "#f6f9fc", surface: "#ffffff", ink: "#0a2540", muted: "#425466", accent: "#635bff" } },
  linear: { displayName: "Linear", path: DESIGN_REFERENCE_PATHS[4], hash: "30bd30e72c48a16e4bdbd010f2d1c85fab657c6fae3cc85389399aab10f9cb5f", tags: ["precise", "dark", "product"], colors: { canvas: "#08090a", surface: "#161719", ink: "#f7f8f8", muted: "#8a8f98", accent: "#5e6ad2" } },
  notion: { displayName: "Notion", path: DESIGN_REFERENCE_PATHS[5], hash: "fa9d6e78216d8f3e5d3990709ca2de6bc2e268e945bb94f255fd1bfb15455266", tags: ["editorial", "warm", "quiet"], colors: { canvas: "#ffffff", surface: "#f7f6f3", ink: "#2f3437", muted: "#787774", accent: "#2383e2" } },
  spotify: { displayName: "Spotify", path: DESIGN_REFERENCE_PATHS[6], hash: "72e964a6cf551d0603f9854f2f42ee08e97ad4d9e17e037f50f6233508288295", tags: ["bold", "dark", "media"], colors: { canvas: "#121212", surface: "#181818", ink: "#ffffff", muted: "#b3b3b3", accent: "#1ed760" } },
  figma: { displayName: "Figma", path: DESIGN_REFERENCE_PATHS[7], hash: "716ce8431f47eb8b8135552710e3c4d538bccccf1202e4ceac5428c9aada9972", tags: ["playful", "modular", "creative"], colors: { canvas: "#ffffff", surface: "#f5f5f5", ink: "#1e1e1e", muted: "#7c7c7c", accent: "#0d99ff" } },
  shopify: { displayName: "Shopify", path: DESIGN_REFERENCE_PATHS[8], hash: "495e89b8d0a1848ded013c040f7a2ae62077e9d87fc4385350e25dee02ccdb38", tags: ["cinematic", "commerce", "bold"], colors: { canvas: "#0b0b0b", surface: "#1a1a1a", ink: "#ffffff", muted: "#a4a4a4", accent: "#95bf47" } },
  wired: { displayName: "WIRED", path: DESIGN_REFERENCE_PATHS[9], hash: "eb439dcc573401dc30583f40e7eef8a60b769232da59e524de6dce56d5c3593e", tags: ["editorial", "dense", "print"], colors: { canvas: "#f4f1ea", surface: "#ffffff", ink: "#101010", muted: "#676767", accent: "#e7131a" } },
};

function fallbackReference(id: DesignId): DesignReferenceV1 {
  const item = metadata[id];
  return {
    id,
    displayName: item.displayName,
    source: { repository: DESIGN_REPOSITORY, path: item.path, commit: BUNDLED_DESIGN_COMMIT, sha256: item.hash },
    nativeTheme: designDefaults[id].theme,
    recommendedMotion: designDefaults[id].motion,
    colors: item.colors,
    typography: {
      display: { family: id === "wired" ? "Archivo Narrow" : "Geist", weight: "700", lineHeight: "1.05", letterSpacing: "-0.03em" },
      body: { family: id === "wired" ? "Source Serif 4" : "Geist", weight: "400", lineHeight: "1.6" },
      mono: { family: "Geist Mono", weight: "400" },
    },
    spacing: { xs: "0.5rem", sm: "0.75rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
    radii: id === "nike" || id === "wired" ? { sm: "0", md: "0", lg: "0" } : { sm: "0.375rem", md: "0.625rem", lg: "1rem" },
    components: {
      button: { background: item.colors.accent, foreground: id === "spotify" ? "#000000" : "#ffffff", radius: id === "airbnb" || id === "spotify" ? "999px" : "0.5rem", padding: "0.75rem 1rem" },
      card: { background: item.colors.surface, foreground: item.colors.ink, border: `1px solid ${item.colors.muted}33`, radius: id === "nike" || id === "wired" ? "0" : "0.75rem", padding: "1rem" },
    },
    layoutPrinciples: ["Use clear hierarchy and deliberate whitespace.", "Keep primary actions visually distinct.", "Use the reference as design guidance, not as a brand replica."],
    responsiveRules: ["Preserve reading order as columns collapse.", "Keep controls at least 44px on touch devices.", "Avoid horizontal overflow at 320px."],
    allowedPatterns: ["Semantic color tokens", "Accessible focus states", "Responsive type and spacing"],
    prohibitedPatterns: ["Brand logos or proprietary assets", "Copied product copy or screenshots", "Unlicensed fonts"],
    tags: item.tags,
    fetchStatus: "cached",
    substitutions: [],
  };
}

export const bundledDesignReferences = (Object.keys(metadata) as DesignId[]).map(fallbackReference);

export function getBundledDesignReference(id: DesignId): DesignReferenceV1 {
  return structuredClone(bundledDesignReferences.find((reference) => reference.id === id) as DesignReferenceV1);
}

export function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function verifyDesignMarkdown(markdown: string, source: DesignReferenceV1["source"]): string {
  if (new TextEncoder().encode(markdown).byteLength > 256_000) throw new Error("Design source exceeds 256 KB.");
  if (sha256(markdown) !== source.sha256) throw new Error("Design source hash does not match its blueprint provenance.");
  return markdown;
}

function safeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function validColor(value: unknown): value is string {
  return typeof value === "string" && (/^#[0-9a-f]{3,8}$/i.test(value) || /^oklch\([0-9.%\s/]+\)$/i.test(value));
}

function validDimension(value: unknown): value is string {
  return typeof value === "string" && value.length <= 32 && (/^-?[0-9.]+(px|rem|em|%|vh|vw)$/.test(value) || value === "0" || value === "999px");
}

function mapFont(value: unknown, role: string): { family: string; substitution?: string } {
  const original = typeof value === "string" ? value.trim().slice(0, 100) : "";
  const lower = original.toLowerCase();
  if (/geist|inter|system-ui|arial|helvetica/.test(lower)) return { family: lower.includes("geist") ? (role === "mono" ? "Geist Mono" : "Geist") : "Geist", substitution: original && !lower.includes("geist") ? `${original} → Geist` : undefined };
  if (/mono|code|courier/.test(lower) || role === "mono") return { family: "Geist Mono", substitution: original ? `${original} → Geist Mono` : undefined };
  if (/serif|times|georgia|editorial/.test(lower)) return { family: "Source Serif 4", substitution: original ? `${original} → Source Serif 4` : undefined };
  if (/condensed|narrow|compressed/.test(lower)) return { family: "Archivo Narrow", substitution: original ? `${original} → Archivo Narrow` : undefined };
  return { family: "Geist", substitution: original ? `${original} → Geist` : undefined };
}

function limitedStrings(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string" && item.length <= 240).slice(0, 20);
}

export function normalizeDesignMarkdown(id: DesignId, markdown: string, source: DesignReferenceV1["source"]): DesignReferenceV1 {
  if (markdown.length > 256_000) throw new Error("Design source exceeds 256 KB.");
  if (sha256(markdown) !== source.sha256) throw new Error("Design source hash does not match its blueprint provenance.");
  let data: Record<string, unknown>;
  try { data = safeRecord(matter(markdown).data); } catch { throw new Error("Design source contains invalid frontmatter."); }
  const fallback = fallbackReference(id);
  const rawColors = safeRecord(data.colors ?? data.color ?? safeRecord(data.tokens).colors);
  const colors = { ...fallback.colors };
  Object.entries(rawColors).slice(0, 32).forEach(([key, value]) => {
    if (/^[a-z][a-z0-9-_]{0,31}$/i.test(key) && validColor(value)) colors[key] = value;
  });
  const rawTypography = safeRecord(data.typography ?? safeRecord(data.tokens).typography);
  const substitutions: string[] = [];
  const typography: Record<string, TypographyToken> = { ...fallback.typography };
  Object.entries(rawTypography).slice(0, 16).forEach(([key, rawValue]) => {
    if (!/^[a-z][a-z0-9-_]{0,31}$/i.test(key)) return;
    const value = typeof rawValue === "string" ? { family: rawValue } : safeRecord(rawValue);
    const mapped = mapFont(value.family ?? value.fontFamily ?? value.font, key);
    if (mapped.substitution) substitutions.push(mapped.substitution);
    typography[key] = {
      family: mapped.family,
      ...(typeof value.weight === "string" && /^[1-9]00$/.test(value.weight) ? { weight: value.weight } : {}),
      ...(validDimension(value.size) ? { size: value.size } : {}),
      ...(typeof value.lineHeight === "string" && value.lineHeight.length <= 16 ? { lineHeight: value.lineHeight } : {}),
      ...(typeof value.letterSpacing === "string" && value.letterSpacing.length <= 16 ? { letterSpacing: value.letterSpacing } : {}),
    };
  });
  const dimensions = (value: unknown, current: Record<string, string>) => {
    const result = { ...current };
    Object.entries(safeRecord(value)).slice(0, 24).forEach(([key, item]) => {
      if (/^[a-z][a-z0-9-_]{0,31}$/i.test(key) && validDimension(item)) result[key] = item;
    });
    return result;
  };
  const rawComponents = safeRecord(data.components);
  const components: Record<string, ComponentStyle> = { ...fallback.components };
  Object.entries(rawComponents).slice(0, 20).forEach(([key, rawValue]) => {
    if (!/^[a-z][a-z0-9-_]{0,31}$/i.test(key)) return;
    const value = safeRecord(rawValue);
    const component: ComponentStyle = {};
    (["background", "foreground", "border", "shadow"] as const).forEach((field) => {
      if (typeof value[field] === "string" && value[field].length <= 100 && !/url\(|javascript:|<|>/i.test(value[field] as string)) component[field] = value[field] as string;
    });
    if (validDimension(value.radius)) component.radius = value.radius;
    if (typeof value.padding === "string" && value.padding.length <= 50 && !/url\(|javascript:|<|>/i.test(value.padding)) component.padding = value.padding;
    components[key] = component;
  });
  return {
    ...fallback,
    source,
    colors,
    typography,
    spacing: dimensions(data.spacing ?? safeRecord(data.tokens).spacing, fallback.spacing),
    radii: dimensions(data.radii ?? data.rounded ?? safeRecord(data.tokens).radii, fallback.radii),
    components,
    layoutPrinciples: limitedStrings(data.layoutPrinciples, fallback.layoutPrinciples),
    responsiveRules: limitedStrings(data.responsiveRules, fallback.responsiveRules),
    allowedPatterns: limitedStrings(data.allowedPatterns, fallback.allowedPatterns),
    prohibitedPatterns: [...new Set([...limitedStrings(data.prohibitedPatterns, []), ...fallback.prohibitedPatterns])].slice(0, 20),
    fetchStatus: "live",
    substitutions: [...new Set(substitutions)],
  };
}

export function matchingBundledFallback(id: DesignId, source: DesignReferenceV1["source"]): DesignReferenceV1 | null {
  const fallback = getBundledDesignReference(id);
  return fallback.source.commit === source.commit && fallback.source.sha256 === source.sha256 && fallback.source.path === source.path ? fallback : null;
}
