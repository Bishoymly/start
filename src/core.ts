export const DESIGN_REFERENCE_PATHS = [
  "design-md/apple/DESIGN.md",
  "design-md/airbnb/DESIGN.md",
  "design-md/nike/DESIGN.md",
  "design-md/stripe/DESIGN.md",
  "design-md/linear.app/DESIGN.md",
  "design-md/notion/DESIGN.md",
  "design-md/spotify/DESIGN.md",
  "design-md/figma/DESIGN.md",
  "design-md/shopify/DESIGN.md",
  "design-md/wired/DESIGN.md",
] as const;

export const DESIGN_REPOSITORY = "voltagent/awesome-design-md" as const;

export const agents = ["codex", "claude-code", "cursor", "github-copilot", "gemini-cli", "opencode", "windsurf", "grok-build"] as const;
export type AgentId = (typeof agents)[number];

export const agentLabels: Record<AgentId, string> = {
  codex: "Codex",
  "claude-code": "Claude Code",
  cursor: "Cursor",
  "github-copilot": "GitHub Copilot",
  "gemini-cli": "Gemini CLI",
  opencode: "OpenCode",
  windsurf: "Windsurf",
  "grok-build": "Grok Build",
};

export type DecisionSource = "recommended" | "user";
export type Decision<T> = { value: T; source: DecisionSource };
export type Theme = "light" | "dark" | "system";
export type MotionLevel = "off" | "subtle" | "expressive";
export type DesignId = "apple" | "airbnb" | "nike" | "stripe" | "linear" | "notion" | "spotify" | "figma" | "shopify" | "wired";
export type WizardStage = "project" | "ui" | "services" | "delivery" | "review";
export const wizardStages: WizardStage[] = ["project", "ui", "services", "delivery", "review"];

export interface TypographyToken {
  family: string;
  weight?: string;
  size?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface ComponentStyle {
  background?: string;
  foreground?: string;
  border?: string;
  radius?: string;
  shadow?: string;
  padding?: string;
}

export interface DesignReferenceV1 {
  id: DesignId;
  displayName: string;
  source: {
    repository: typeof DESIGN_REPOSITORY;
    path: (typeof DESIGN_REFERENCE_PATHS)[number];
    commit: string;
    sha256: string;
  };
  nativeTheme: "light" | "dark";
  recommendedMotion: MotionLevel;
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
  components: Record<string, ComponentStyle>;
  layoutPrinciples: string[];
  responsiveRules: string[];
  allowedPatterns: string[];
  prohibitedPatterns: string[];
  tags: [string, string, string];
  fetchStatus?: "live" | "cached";
  substitutions?: string[];
}

export type UiFoundation = "base-ui" | "radix-ui";
export type StartingSurface = "minimal" | "top-nav" | "sidebar";
export type ShadcnPresetTheme = "neutral" | "stone" | "zinc" | "gray" | "amber" | "blue" | "cyan" | "emerald" | "fuchsia" | "green" | "indigo" | "lime" | "orange" | "pink" | "purple" | "red" | "rose" | "sky" | "teal" | "violet" | "yellow" | "mauve" | "olive" | "mist" | "taupe";
export type ShadcnPreset = {
  code: string;
  style: "nova" | "vega" | "maia" | "lyra" | "mira" | "luma" | "sera" | "rhea";
  baseColor: "neutral" | "stone" | "zinc" | "gray" | "mauve" | "olive" | "mist" | "taupe";
  theme: ShadcnPresetTheme;
  chartColor: ShadcnPresetTheme;
  iconLibrary: "lucide" | "hugeicons" | "tabler" | "phosphor" | "remixicon";
  font: "inter" | "noto-sans" | "nunito-sans" | "figtree" | "roboto" | "raleway" | "dm-sans" | "public-sans" | "outfit" | "jetbrains-mono" | "geist" | "geist-mono" | "lora" | "merriweather" | "playfair-display" | "noto-serif" | "roboto-slab" | "oxanium" | "manrope" | "space-grotesk" | "montserrat" | "ibm-plex-sans" | "source-sans-3" | "instrument-sans" | "eb-garamond" | "instrument-serif";
  fontHeading: "inherit" | ShadcnPreset["font"];
  radius: "default" | "none" | "small" | "medium" | "large";
  menuAccent: "subtle" | "bold";
  menuColor: "default" | "inverted" | "default-translucent" | "inverted-translucent";
};
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type ToolingChoice = "biome" | "eslint-prettier";
export type CodeHost = "github" | "gitlab" | "azure-devops" | "undecided";
export type AuthChoice = "none" | "better-auth";
export type AuthMethod = "email-password" | "github" | "google" | "microsoft";
export type DatabaseProvider = "neon" | "supabase" | "docker" | "existing-url" | "azure-postgresql" | "aws-rds" | "gcp-cloud-sql";
export type OrmChoice = "drizzle" | "prisma";
export type StorageChoice = "none" | "vercel-blob" | "s3" | "r2" | "azure-blob" | "gcs" | "supabase-storage";
export type AiProvider = "openai" | "anthropic" | "google" | "azure-openai" | "bedrock" | "vertex" | "vercel-ai-gateway";
export type HostingChoice = "vercel" | "cloudflare" | "azure" | "aws" | "gcp" | "docker";
export type CiChoice = "github-actions" | "gitlab-ci" | "azure-pipelines";
export type TestingChoice = "vitest" | "playwright";
export type ObservabilityChoice = "opentelemetry" | "sentry";

export interface WizardStateV2 {
  version: 2;
  stage: WizardStage;
  projectName: Decision<string>;
  targetDirectory: Decision<string>;
  primaryAgent: Decision<AgentId>;
  additionalAgents: Decision<AgentId[]>;
  packageManager: Decision<PackageManager>;
  tooling: Decision<ToolingChoice>;
  codeHost: Decision<CodeHost>;
  uiFoundation: Decision<UiFoundation>;
  shadcnPreset: Decision<ShadcnPreset>;
  startingSurface: Decision<StartingSurface>;
  designReference: Decision<DesignId | null>;
  theme: Decision<Theme>;
  motion: Decision<MotionLevel>;
  authentication: Decision<AuthChoice>;
  authMethods: Decision<AuthMethod[]>;
  databaseRequired: Decision<boolean>;
  databaseProvider: Decision<DatabaseProvider>;
  orm: Decision<OrmChoice>;
  storage: Decision<StorageChoice>;
  aiProviders: Decision<AiProvider[]>;
  hosting: Decision<HostingChoice>;
  ciEnabled: Decision<boolean>;
  vitest: Decision<boolean>;
  playwright: Decision<boolean>;
  opentelemetry: Decision<boolean>;
  sentry: Decision<boolean>;
  firstTask: Decision<string>;
  dormant: Partial<{
    databaseProvider: Decision<DatabaseProvider>;
    orm: Decision<OrmChoice>;
    hostingChoices: Partial<Record<HostingChoice, { databaseProvider: Decision<DatabaseProvider>; storage: Decision<StorageChoice> }>>;
  }>;
  designProvenance: DesignReferenceV1["source"] | null;
}

export interface StarterConfigV2 {
  version: 2;
  projectName: string;
  targetDirectory: string;
  primaryAgent: AgentId;
  additionalAgents: AgentId[];
  packageManager: PackageManager;
  tooling: ToolingChoice;
  codeHost: CodeHost;
  ciEnabled: boolean;
  ci: CiChoice;
  uiFoundation: UiFoundation;
  shadcnPreset: ShadcnPreset;
  startingSurface: StartingSurface;
  designReference: DesignId | null;
  designSource: DesignReferenceV1["source"] | null;
  theme: Theme;
  themeAdapted: boolean;
  motion: MotionLevel;
  authentication: AuthChoice;
  authMethods: AuthMethod[];
  databaseRequired: boolean;
  databaseProvider?: DatabaseProvider;
  orm?: OrmChoice;
  storage: StorageChoice;
  aiProviders: AiProvider[];
  hosting: HostingChoice;
  testing: TestingChoice[];
  observability: ObservabilityChoice[];
  firstTask: string;
}

export interface RecommendationResult {
  state: WizardStateV2;
  changed: string[];
  reasons: string[];
}

const recommended = <T>(value: T): Decision<T> => ({ value, source: "recommended" });

const presetStyles = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;
const presetBaseColors = ["neutral", "stone", "zinc", "gray", "mauve", "olive", "mist", "taupe"] as const;
const presetThemes = ["neutral", "stone", "zinc", "gray", "amber", "blue", "cyan", "emerald", "fuchsia", "green", "indigo", "lime", "orange", "pink", "purple", "red", "rose", "sky", "teal", "violet", "yellow", "mauve", "olive", "mist", "taupe"] as const;
const presetIcons = ["lucide", "hugeicons", "tabler", "phosphor", "remixicon"] as const;
const presetFonts = ["inter", "noto-sans", "nunito-sans", "figtree", "roboto", "raleway", "dm-sans", "public-sans", "outfit", "jetbrains-mono", "geist", "geist-mono", "lora", "merriweather", "playfair-display", "noto-serif", "roboto-slab", "oxanium", "manrope", "space-grotesk", "montserrat", "ibm-plex-sans", "source-sans-3", "instrument-sans", "eb-garamond", "instrument-serif"] as const;
const presetHeadingFonts = ["inherit", ...presetFonts] as const;
const presetRadii = ["default", "none", "small", "medium", "large"] as const;
const presetMenuAccents = ["subtle", "bold"] as const;
const presetMenuColors = ["default", "inverted", "default-translucent", "inverted-translucent"] as const;
const presetFields = [
  { key: "menuColor", values: presetMenuColors, bits: 3 },
  { key: "menuAccent", values: presetMenuAccents, bits: 3 },
  { key: "radius", values: presetRadii, bits: 4 },
  { key: "font", values: presetFonts, bits: 6 },
  { key: "iconLibrary", values: presetIcons, bits: 6 },
  { key: "theme", values: presetThemes, bits: 6 },
  { key: "baseColor", values: presetBaseColors, bits: 6 },
  { key: "style", values: presetStyles, bits: 6 },
  { key: "chartColor", values: presetThemes, bits: 6 },
  { key: "fontHeading", values: presetHeadingFonts, bits: 5 },
] as const;
const presetAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function fromBase62(value: string): number {
  let result = 0;
  for (const character of value) {
    const digit = presetAlphabet.indexOf(character);
    if (digit < 0) return -1;
    result = result * 62 + digit;
  }
  return result;
}

export function decodeShadcnPreset(code: string): ShadcnPreset | null {
  if (!/^[ab][0-9A-Za-z]{1,9}$/.test(code)) return null;
  const fields = code[0] === "a" ? presetFields.slice(0, 8) : presetFields;
  const packed = fromBase62(code.slice(1));
  if (packed < 0) return null;
  const result: Record<string, string> = {};
  let offset = 0;
  for (const field of fields) {
    const index = Math.floor(packed / 2 ** offset) % 2 ** field.bits;
    result[field.key] = field.values[index] ?? field.values[0];
    offset += field.bits;
  }
  if (code[0] === "a") result.fontHeading = "inherit";
  return { code, ...result } as ShadcnPreset;
}

export const defaultShadcnPreset = decodeShadcnPreset("b0") as ShadcnPreset;

export function parseShadcnPresetInput(input: string): { preset: ShadcnPreset; foundation?: UiFoundation } {
  const value = input.trim();
  if (!value || value.length > 1_000 || /[\0\u0001-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error("Paste a shadcn preset code, init URL, or copied init command.");
  let code = /^[ab][0-9A-Za-z]{1,9}$/.test(value) ? value : undefined;
  let base: string | null | undefined;
  const commandPreset = value.match(/(?:^|\s)--preset(?:=|\s+)["']?([ab][0-9A-Za-z]{1,9})["']?(?=\s|$)/);
  const commandBase = value.match(/(?:^|\s)--base(?:=|\s+)["']?([^\s"']+)["']?(?=\s|$)/);
  code ??= commandPreset?.[1];
  base = commandBase?.[1];
  const urlText = value.match(/https:\/\/ui\.shadcn\.com\/(?:init|create)[^\s"']*/)?.[0];
  if (urlText) {
    const url = new URL(urlText);
    code ??= url.searchParams.get("preset") ?? undefined;
    base ??= url.searchParams.get("base");
  }
  const preset = code ? decodeShadcnPreset(code) : null;
  if (!preset) throw new Error("No valid shadcn preset code was found. Copy the init command from ui.shadcn.com/create.");
  if (base && base !== "base" && base !== "radix") throw new Error("The preset uses an unsupported shadcn foundation.");
  return { preset, ...(base ? { foundation: base === "base" ? "base-ui" : "radix-ui" } : {}) };
}

export function isValidFirstTask(value: string): boolean {
  return value.length <= 500 && !/[\0\u0001-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}

export function createDefaultWizardState(): WizardStateV2 {
  return {
    version: 2,
    stage: "project",
    projectName: recommended("my-app"),
    targetDirectory: recommended("my-app"),
    primaryAgent: recommended("codex"),
    additionalAgents: recommended([]),
    packageManager: recommended("pnpm"),
    tooling: recommended("biome"),
    codeHost: recommended("github"),
    uiFoundation: recommended("base-ui"),
    shadcnPreset: recommended(defaultShadcnPreset),
    startingSurface: recommended("minimal"),
    designReference: recommended(null),
    theme: recommended("light"),
    motion: recommended("subtle"),
    authentication: recommended("none"),
    authMethods: recommended(["email-password"]),
    databaseRequired: recommended(false),
    databaseProvider: recommended("neon"),
    orm: recommended("drizzle"),
    storage: recommended("none"),
    aiProviders: recommended([]),
    hosting: recommended("vercel"),
    ciEnabled: recommended(true),
    vitest: recommended(true),
    playwright: recommended(true),
    opentelemetry: recommended(true),
    sentry: recommended(false),
    firstTask: recommended(""),
    dormant: {},
    designProvenance: null,
  };
}

function setRecommended<T>(decision: Decision<T>, value: T, label: string, changed: string[]) {
  if (decision.source === "recommended" && JSON.stringify(decision.value) !== JSON.stringify(value)) {
    changed.push(label);
    return recommended(value);
  }
  return decision;
}

export const designDefaults: Record<DesignId, { theme: "light" | "dark"; motion: MotionLevel }> = {
  apple: { theme: "light", motion: "subtle" },
  airbnb: { theme: "light", motion: "subtle" },
  nike: { theme: "light", motion: "subtle" },
  stripe: { theme: "light", motion: "expressive" },
  linear: { theme: "dark", motion: "subtle" },
  notion: { theme: "light", motion: "off" },
  spotify: { theme: "dark", motion: "expressive" },
  figma: { theme: "light", motion: "expressive" },
  shopify: { theme: "dark", motion: "expressive" },
  wired: { theme: "light", motion: "off" },
};

export function deriveCi(codeHost: CodeHost): CiChoice {
  if (codeHost === "gitlab") return "gitlab-ci";
  if (codeHost === "azure-devops") return "azure-pipelines";
  return "github-actions";
}

export const databaseOptionsByHosting: Record<HostingChoice, readonly DatabaseProvider[]> = {
  vercel: ["neon", "supabase", "existing-url"],
  cloudflare: ["neon", "supabase", "existing-url"],
  azure: ["azure-postgresql", "existing-url"],
  aws: ["aws-rds", "existing-url"],
  gcp: ["gcp-cloud-sql", "existing-url"],
  docker: ["docker", "existing-url"],
};

export const storageOptionsByHosting: Record<HostingChoice, readonly StorageChoice[]> = {
  vercel: ["none", "vercel-blob", "supabase-storage"],
  cloudflare: ["none", "r2"],
  azure: ["none", "azure-blob"],
  aws: ["none", "s3"],
  gcp: ["none", "gcs"],
  docker: ["none", "s3"],
};

export const recommendedDatabaseByHosting: Record<HostingChoice, DatabaseProvider> = {
  vercel: "neon",
  cloudflare: "neon",
  azure: "azure-postgresql",
  aws: "aws-rds",
  gcp: "gcp-cloud-sql",
  docker: "docker",
};

export function recommendationFor(state: WizardStateV2, key: keyof WizardStateV2): unknown {
  const design = state.designReference.value;
  const defaults = createDefaultWizardState();
  if (key === "theme") return design ? designDefaults[design].theme : defaults.theme.value;
  if (key === "motion") return design ? designDefaults[design].motion : defaults.motion.value;
  if (key === "databaseRequired") return state.authentication.value === "better-auth";
  if (key === "databaseProvider") return recommendedDatabaseByHosting[state.hosting.value];
  if (key === "orm") return "drizzle";
  return (defaults as unknown as Record<string, Decision<unknown>>)[key as string]?.value;
}

export function recomputeRecommendations(input: WizardStateV2): RecommendationResult {
  const state = structuredClone(input);
  const changed: string[] = [];
  const reasons: string[] = [];
  const design = state.designReference.value;
  if (design) {
    state.theme = setRecommended(state.theme, designDefaults[design].theme, "Theme", changed);
    state.motion = setRecommended(state.motion, designDefaults[design].motion, "Motion", changed);
    reasons.push(`${design} supplies the default theme and motion profile.`);
  } else {
    state.theme = setRecommended(state.theme, "light", "Theme", changed);
    state.motion = setRecommended(state.motion, "subtle", "Motion", changed);
  }
  if (state.authentication.value === "better-auth") {
    state.authMethods = setRecommended(state.authMethods, ["email-password"], "Sign-in methods", changed);
    state.databaseRequired = setRecommended(state.databaseRequired, true, "Database requirement", changed);
    state.databaseProvider = setRecommended(state.databaseProvider, recommendedDatabaseByHosting[state.hosting.value], "Database provider", changed);
    state.orm = setRecommended(state.orm, "drizzle", "ORM", changed);
    reasons.push(`Better Auth recommends email and password with Postgres, ${recommendedDatabaseByHosting[state.hosting.value]}, and Drizzle while those choices are untouched.`);
  } else {
    state.databaseRequired = setRecommended(state.databaseRequired, false, "Database requirement", changed);
  }
  const databaseOptions = databaseOptionsByHosting[state.hosting.value];
  if (!databaseOptions.includes(state.databaseProvider.value)) {
    state.dormant.databaseProvider = state.databaseProvider;
    state.databaseProvider = recommended(recommendedDatabaseByHosting[state.hosting.value]);
    changed.push("Database provider");
  }
  const storageOptions = storageOptionsByHosting[state.hosting.value];
  if (!storageOptions.includes(state.storage.value)) {
    state.storage = recommended("none");
    changed.push("Storage");
  }
  reasons.push(`${state.hosting.value} scopes the database and storage choices to compatible options.`);
  return { state, changed, reasons };
}

export function setUserDecision<K extends keyof WizardStateV2>(state: WizardStateV2, key: K, value: WizardStateV2[K] extends Decision<infer T> ? T : never): RecommendationResult {
  const next = structuredClone(state);
  const previousHosting = next.hosting.value;
  const current = next[key];
  if (current && typeof current === "object" && "source" in current) (next as unknown as Record<string, unknown>)[key] = { value, source: "user" };
  if (key === "projectName" && next.targetDirectory.source === "recommended") next.targetDirectory = recommended(String(value));
  if (key === "databaseRequired") {
    const required = value as boolean;
    if (!required) {
      next.dormant.databaseProvider = next.databaseProvider;
      next.dormant.orm = next.orm;
    } else {
      if (next.dormant.databaseProvider) next.databaseProvider = next.dormant.databaseProvider;
      if (next.dormant.orm) next.orm = next.dormant.orm;
    }
  }
  if (key === "hosting") {
    next.dormant.hostingChoices ??= {};
    next.dormant.hostingChoices[previousHosting] = { databaseProvider: state.databaseProvider, storage: state.storage };
    const restored = next.dormant.hostingChoices[value as HostingChoice];
    next.databaseProvider = restored?.databaseProvider ?? recommended(recommendedDatabaseByHosting[value as HostingChoice]);
    next.storage = restored?.storage ?? recommended("none");
  }
  return recomputeRecommendations(next);
}

export function useRecommendation<K extends keyof WizardStateV2>(state: WizardStateV2, key: K): RecommendationResult {
  const next = structuredClone(state);
  const current = next[key];
  if (current && typeof current === "object" && "source" in current) {
    const dynamicKeys: (keyof WizardStateV2)[] = ["targetDirectory", "theme", "motion", "authMethods", "databaseRequired", "databaseProvider", "orm"];
    if (dynamicKeys.includes(key)) {
      (current as Decision<unknown>).source = "recommended";
      if (key === "targetDirectory") next.targetDirectory.value = next.projectName.value;
    } else {
      (next as unknown as Record<string, unknown>)[key as string] = structuredClone((createDefaultWizardState() as unknown as Record<string, unknown>)[key as string]);
    }
  }
  return recomputeRecommendations(next);
}

function clouds(state: WizardStateV2): Set<string> {
  const result = new Set<string>();
  const lookup: Record<string, string> = {
    "vercel-blob": "Vercel", "vercel-ai-gateway": "Vercel", r2: "Cloudflare",
    "azure-blob": "Azure", "azure-postgresql": "Azure", "azure-openai": "Azure",
    s3: "AWS", "aws-rds": "AWS", bedrock: "AWS", gcs: "GCP", "gcp-cloud-sql": "GCP", vertex: "GCP",
  };
  [state.storage.value, state.databaseRequired.value ? state.databaseProvider.value : "", ...state.aiProviders.value].forEach((value) => {
    if (lookup[value]) result.add(lookup[value]);
  });
  return result;
}

export function isValidProjectName(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(value);
}

export function isValidTargetDirectory(value: string): boolean {
  if (value === ".") return true;
  if (!value || value.length > 160 || value.startsWith("/") || value.includes("\\") || value.includes("//") || /^[a-z]:/i.test(value)) return false;
  const reserved = new Set([".git", ".next", "node_modules"]);
  return value.split("/").every((segment) => segment !== "." && segment !== ".." && !reserved.has(segment.toLowerCase()) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(segment) && /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9_-]$|^[a-zA-Z0-9]$/.test(segment));
}

export function validateWizardState(state: WizardStateV2): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (Boolean(state.designReference.value) !== Boolean(state.designProvenance)) errors.push("The design reference and its provenance must be selected together.");
  if (!isValidProjectName(state.projectName.value)) errors.push("Project name must use 1–50 lowercase letters, numbers, or hyphens.");
  if (!isValidTargetDirectory(state.targetDirectory.value)) errors.push("Target folder must be a safe relative path without spaces, backslashes, or parent-directory segments.");
  if (!isShadcnPreset(state.shadcnPreset.value)) errors.push("The shadcn preset is invalid. Import it again from ui.shadcn.com/create.");
  if (!isValidFirstTask(state.firstTask.value)) errors.push("First task must be 500 characters or fewer and cannot contain control characters.");
  if (state.authentication.value === "better-auth" && !state.databaseRequired.value) errors.push("Better Auth requires a database.");
  if (state.authentication.value === "better-auth" && state.authMethods.value.length === 0) errors.push("Select at least one Better Auth sign-in method.");
  const selectedClouds = clouds(state);
  if (selectedClouds.size > 1) warnings.push(`This selection spans ${[...selectedClouds].join(", ")}. It is supported, but may add latency, credentials, and billing surfaces.`);
  if (state.theme.value !== "system" && state.designReference.value && state.theme.value !== designDefaults[state.designReference.value].theme) warnings.push("The selected theme adapts the source reference. The implementation will record that adaptation without rewriting DESIGN.md.");
  return { errors, warnings };
}

export function resolveStarterConfig(state: WizardStateV2): StarterConfigV2 {
  const validation = validateWizardState(state);
  if (validation.errors.length) throw new Error(validation.errors.join(" "));
  const designReference = state.designReference.value;
  const designSource = state.designProvenance;
  return {
    version: 2,
    projectName: state.projectName.value,
    targetDirectory: state.targetDirectory.value,
    primaryAgent: state.primaryAgent.value,
    additionalAgents: [...new Set(state.additionalAgents.value.filter((agent) => agent !== state.primaryAgent.value))],
    packageManager: state.packageManager.value,
    tooling: state.tooling.value,
    codeHost: state.codeHost.value,
    ciEnabled: state.ciEnabled.value,
    ci: deriveCi(state.codeHost.value),
    uiFoundation: state.uiFoundation.value,
    shadcnPreset: structuredClone(state.shadcnPreset.value),
    startingSurface: state.startingSurface.value,
    designReference,
    designSource,
    theme: state.theme.value,
    themeAdapted: designReference !== null && (state.theme.value === "system" || state.theme.value !== designDefaults[designReference].theme),
    motion: state.motion.value,
    authentication: state.authentication.value,
    authMethods: state.authentication.value === "better-auth" ? [...new Set(state.authMethods.value)] : [],
    databaseRequired: state.databaseRequired.value,
    ...(state.databaseRequired.value ? { databaseProvider: state.databaseProvider.value, orm: state.orm.value } : {}),
    storage: state.storage.value,
    aiProviders: [...new Set(state.aiProviders.value)],
    hosting: state.hosting.value,
    testing: [state.vitest.value ? "vitest" as const : null, state.playwright.value ? "playwright" as const : null].filter((item): item is TestingChoice => item !== null),
    observability: [state.opentelemetry.value ? "opentelemetry" as const : null, state.sentry.value ? "sentry" as const : null].filter((item): item is ObservabilityChoice => item !== null),
    firstTask: state.firstTask.value.trim(),
  };
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function encodeBlueprint(config: StarterConfigV2): string {
  return `v2.${toBase64Url(JSON.stringify(config))}`;
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isShadcnPreset(value: unknown): value is ShadcnPreset {
  if (!value || typeof value !== "object") return false;
  const preset = value as Partial<ShadcnPreset>;
  const decoded = typeof preset.code === "string" ? decodeShadcnPreset(preset.code) : null;
  return Boolean(decoded && JSON.stringify(decoded) === JSON.stringify(preset));
}

export function decodeBlueprint(token: string): StarterConfigV2 {
  if (token.startsWith("v1.")) throw new Error("Blueprint v1 is no longer supported. Rebuild this blueprint at https://bishoy.io/start.");
  if (!token.startsWith("v2.") || token.length > 32_000) throw new Error("Unsupported or oversized blueprint token.");
  let parsed: unknown;
  try { parsed = JSON.parse(fromBase64Url(token.slice(3))); } catch { throw new Error("Blueprint token is malformed."); }
  if (!parsed || typeof parsed !== "object" || (parsed as { version?: unknown }).version !== 2) throw new Error("Blueprint schema is not supported.");
  const raw = parsed as Partial<StarterConfigV2>;
  const config = {
    ...raw,
    shadcnPreset: raw.shadcnPreset ?? defaultShadcnPreset,
    startingSurface: raw.startingSurface ?? "minimal",
    firstTask: raw.firstTask ?? "",
  } as StarterConfigV2;
  if (!isValidProjectName(config.projectName) || !isValidTargetDirectory(config.targetDirectory) || !agents.includes(config.primaryAgent) || !Array.isArray(config.additionalAgents) || !config.additionalAgents.every((agent) => agents.includes(agent))) throw new Error("Blueprint contains an unsupported project, target folder, or agent.");
  const expectedDesignPath: Record<DesignId, (typeof DESIGN_REFERENCE_PATHS)[number]> = { apple: DESIGN_REFERENCE_PATHS[0], airbnb: DESIGN_REFERENCE_PATHS[1], nike: DESIGN_REFERENCE_PATHS[2], stripe: DESIGN_REFERENCE_PATHS[3], linear: DESIGN_REFERENCE_PATHS[4], notion: DESIGN_REFERENCE_PATHS[5], spotify: DESIGN_REFERENCE_PATHS[6], figma: DESIGN_REFERENCE_PATHS[7], shopify: DESIGN_REFERENCE_PATHS[8], wired: DESIGN_REFERENCE_PATHS[9] };
  const hasDesignReference = config.designReference !== null;
  const hasDesignSource = config.designSource !== null;
  if (hasDesignReference !== hasDesignSource) throw new Error("Blueprint design reference and provenance must be selected together.");
  if (config.designReference !== null && config.designSource !== null) {
    if (!includes(Object.keys(expectedDesignPath) as DesignId[], config.designReference) || !DESIGN_REFERENCE_PATHS.includes(config.designSource.path) || expectedDesignPath[config.designReference] !== config.designSource.path) throw new Error("Blueprint design ID and path do not match.");
    if (config.designSource.repository !== DESIGN_REPOSITORY || !/^[a-f0-9]{40}$/i.test(config.designSource.commit) || !/^[a-f0-9]{64}$/i.test(config.designSource.sha256)) throw new Error("Blueprint design provenance is invalid.");
  }
  if (!includes(["npm", "pnpm", "yarn", "bun"] as const, config.packageManager)
    || !includes(["biome", "eslint-prettier"] as const, config.tooling)
    || !includes(["github", "gitlab", "azure-devops", "undecided"] as const, config.codeHost)
    || typeof config.ciEnabled !== "boolean"
    || !includes(["github-actions", "gitlab-ci", "azure-pipelines"] as const, config.ci)
    || !includes(["base-ui", "radix-ui"] as const, config.uiFoundation)
    || !isShadcnPreset(config.shadcnPreset)
    || !includes(["minimal", "top-nav", "sidebar"] as const, config.startingSurface)
    || !includes(["light", "dark", "system"] as const, config.theme)
    || !includes(["off", "subtle", "expressive"] as const, config.motion)
    || !includes(["none", "better-auth"] as const, config.authentication)
    || !Array.isArray(config.authMethods)
    || !config.authMethods.every((method) => includes(["email-password", "github", "google", "microsoft"] as const, method))
    || !includes(["none", "vercel-blob", "s3", "r2", "azure-blob", "gcs", "supabase-storage"] as const, config.storage)
    || !includes(["vercel", "cloudflare", "azure", "aws", "gcp", "docker"] as const, config.hosting)
    || !Array.isArray(config.testing) || !config.testing.every((choice) => includes(["vitest", "playwright"] as const, choice))
    || !Array.isArray(config.observability) || !config.observability.every((choice) => includes(["opentelemetry", "sentry"] as const, choice))
    || !Array.isArray(config.aiProviders)
    || !config.aiProviders.every((provider) => includes(["openai", "anthropic", "google", "azure-openai", "bedrock", "vertex", "vercel-ai-gateway"] as const, provider))
    || typeof config.firstTask !== "string" || !isValidFirstTask(config.firstTask)) throw new Error("Blueprint contains an unsupported configuration value.");
  if (config.authentication === "better-auth" && (!config.authMethods.length || !config.databaseRequired)) throw new Error("Blueprint Better Auth configuration is incomplete.");
  if (config.authentication === "none" && config.authMethods.length) throw new Error("Blueprint contains inactive authentication methods.");
  if (config.databaseRequired && (!includes(["neon", "supabase", "docker", "existing-url", "azure-postgresql", "aws-rds", "gcp-cloud-sql"] as const, config.databaseProvider) || !includes(["drizzle", "prisma"] as const, config.orm))) throw new Error("Blueprint database configuration is incomplete.");
  if (config.ci !== deriveCi(config.codeHost)) throw new Error("Blueprint CI does not match its code host.");
  return config;
}

export function buildStarterCommand(config: StarterConfigV2): string {
  const launcher: Record<PackageManager, string> = { npm: "npx", pnpm: "pnpm dlx", yarn: "yarn dlx", bun: "bunx" };
  return `${launcher[config.packageManager]} @bishoymly/start@latest ${config.targetDirectory} --blueprint ${encodeBlueprint(config)}`;
}

export function buildAgentKickoffPrompt(config: StarterConfigV2): string {
  const task = config.firstTask || "Implement the first useful vertical slice for this product";
  const sources = config.designReference ? "AGENTS.md, APP_BLUEPRINT.md, DESIGN.md, and README.md" : "AGENTS.md, APP_BLUEPRINT.md, and README.md";
  return `Read ${sources} before editing. Confirm the generated baseline is healthy, then ${task.charAt(0).toLowerCase()}${task.slice(1)}. Preserve the selected ${config.shadcnPreset.style} shadcn preset and ${config.startingSurface} starting surface. Do not add unselected providers or infrastructure. Add focused tests, run ${config.packageManager} run verify, and report the exact results and any remaining risks.`;
}
