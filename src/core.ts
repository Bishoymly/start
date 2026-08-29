const DESIGN_REFERENCE_PATHS = [
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

const DESIGN_REPOSITORY = "voltagent/awesome-design-md" as const;

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
type Theme = "light" | "dark" | "system";
type MotionLevel = "off" | "subtle" | "expressive";
type DesignId = "apple" | "airbnb" | "nike" | "stripe" | "linear" | "notion" | "spotify" | "figma" | "shopify" | "wired";
type WizardStage = "project" | "ui" | "services" | "delivery" | "review";
const wizardStages: WizardStage[] = ["project", "ui", "services", "delivery", "review"];

interface TypographyToken {
  family: string;
  weight?: string;
  size?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

interface ComponentStyle {
  background?: string;
  foreground?: string;
  border?: string;
  radius?: string;
  shadow?: string;
  padding?: string;
}

interface DesignReferenceV1 {
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
type StartingSurface = "minimal" | "top-nav" | "sidebar";
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

interface WizardStateV2 {
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

interface StarterConfigV2 {
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

interface RecommendationResult {
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

function isValidFirstTask(value: string): boolean {
  return value.length <= 500 && !/[\0\u0001-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}

function createDefaultWizardState(): WizardStateV2 {
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

const designDefaults: Record<DesignId, { theme: "light" | "dark"; motion: MotionLevel }> = {
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

function recommendationFor(state: WizardStateV2, key: keyof WizardStateV2): unknown {
  const design = state.designReference.value;
  const defaults = createDefaultWizardState();
  if (key === "theme") return design ? designDefaults[design].theme : defaults.theme.value;
  if (key === "motion") return design ? designDefaults[design].motion : defaults.motion.value;
  if (key === "databaseRequired") return state.authentication.value === "better-auth";
  if (key === "databaseProvider") return recommendedDatabaseByHosting[state.hosting.value];
  if (key === "orm") return "drizzle";
  return (defaults as unknown as Record<string, Decision<unknown>>)[key as string]?.value;
}

function recomputeRecommendations(input: WizardStateV2): RecommendationResult {
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

function setUserDecision<K extends keyof WizardStateV2>(state: WizardStateV2, key: K, value: WizardStateV2[K] extends Decision<infer T> ? T : never): RecommendationResult {
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

function useRecommendation<K extends keyof WizardStateV2>(state: WizardStateV2, key: K): RecommendationResult {
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

function validateWizardState(state: WizardStateV2): { errors: string[]; warnings: string[] } {
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

function resolveStarterConfig(state: WizardStateV2): StarterConfigV2 {
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

function encodeBlueprint(config: StarterConfigV2): string {
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

function decodeBlueprint(token: string): StarterConfigV2 {
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

function buildStarterCommand(config: StarterConfigV2): string {
  const launcher: Record<PackageManager, string> = { npm: "npx", pnpm: "pnpm dlx", yarn: "yarn dlx", bun: "bunx" };
  return `${launcher[config.packageManager]} @bishoymly/start@latest ${config.targetDirectory} --blueprint ${encodeBlueprint(config)}`;
}

function buildAgentKickoffPrompt(config: StarterConfigV2): string {
  const task = config.firstTask || "Implement the first useful vertical slice for this product";
  const sources = config.designReference ? "AGENTS.md, APP_BLUEPRINT.md, DESIGN.md, and README.md" : "AGENTS.md, APP_BLUEPRINT.md, and README.md";
  return `Read ${sources} before editing. Confirm the generated baseline is healthy, then ${task.charAt(0).toLowerCase()}${task.slice(1)}. Preserve the selected ${config.shadcnPreset.style} shadcn preset and ${config.startingSurface} starting surface. Do not add unselected providers or infrastructure. Add focused tests, run ${config.packageManager} run verify, and report the exact results and any remaining risks.`;
}

// v3 is intentionally separate from the v2 compatibility surface above. The
// old renderer and terminal flow are migrated independently; keeping their
// types here for one release avoids forcing consumers to update atomically.
// New CLI and web code must use the V3 exports below.

export const blueprintVersion = 3 as const;

export type WizardStageV3 = "project" | "agents" | "preset" | "infrastructure" | "quality" | "review";
export const wizardStagesV3: readonly WizardStageV3[] = ["project", "agents", "preset", "infrastructure", "quality", "review"];

export interface WizardStateV3 {
  version: 3;
  stage: WizardStageV3;
  projectName: Decision<string>;
  targetDirectory: Decision<string>;
  primaryAgent: Decision<AgentId>;
  additionalAgents: Decision<AgentId[]>;
  packageManager: Decision<PackageManager>;
  tooling: Decision<ToolingChoice>;
  codeHost: Decision<CodeHost>;
  uiFoundation: Decision<UiFoundation>;
  shadcnPreset: Decision<ShadcnPreset>;
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
  dormant: Partial<{
    databaseProvider: Decision<DatabaseProvider>;
    orm: Decision<OrmChoice>;
    hostingChoices: Partial<Record<HostingChoice, { databaseProvider: Decision<DatabaseProvider>; storage: Decision<StorageChoice> }>>;
  }>;
}

export interface StarterConfigV3 {
  version: 3;
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
}

export interface V3RecommendationResult {
  state: WizardStateV3;
  changed: string[];
  reasons: string[];
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export type Postcondition = "absent" | "satisfied" | "different";
export type ConflictPolicy = "prompt" | "preserve" | "overwrite";
export type PlanStepKind = "official-command" | "start-configuration" | "skill-install" | "verification";
export type PlanStepOwner = "official" | "start" | "user";

export interface CommandContract {
  command: string;
  postcondition: Postcondition;
  conflictPolicy: ConflictPolicy;
  affectedPaths: string[];
}

export interface ExecutionPlanStep {
  id: string;
  kind: PlanStepKind;
  owner: PlanStepOwner;
  title: string;
  description: string;
  command?: CommandContract;
  operations?: string[];
  capabilities?: string[];
}

export interface SkillContract {
  id: string;
  source: string;
  agents: AgentId[];
  projectScope: true;
  expectedPaths: string[];
  installCommand: string;
}

export interface EnvironmentContract {
  name: string;
  purpose: string;
  required: boolean;
  capability: string;
}

export interface CapabilityContract {
  id: string;
  status: "available" | "unavailable";
  description: string;
  requires: string[];
  excludesProductBehavior: true;
}

export interface VerificationContract {
  command: string;
  checks: string[];
  awaitRequirements: true;
}

export interface ExecutionPlanV3 {
  version: 3;
  blueprint: string;
  steps: ExecutionPlanStep[];
  skills: SkillContract[];
  environment: EnvironmentContract[];
  capabilities: CapabilityContract[];
  verification: VerificationContract;
  warnings: string[];
}

const v3KnownKeys = new Set<keyof WizardStateV3>([
  "version", "stage", "projectName", "targetDirectory", "primaryAgent", "additionalAgents", "packageManager", "tooling", "codeHost", "uiFoundation", "shadcnPreset", "authentication", "authMethods", "databaseRequired", "databaseProvider", "orm", "storage", "aiProviders", "hosting", "ciEnabled", "vitest", "playwright", "opentelemetry", "sentry", "dormant",
]);

/** Create the v3 builder state. It deliberately contains no presentation or product decisions. */
export function createDefaultState(): WizardStateV3 {
  return {
    version: 3,
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
    opentelemetry: recommended(false),
    sentry: recommended(false),
    dormant: {},
  };
}

export function recommendationForV3(state: WizardStateV3, key: keyof WizardStateV3): unknown {
  if (key === "databaseRequired") return state.authentication.value === "better-auth";
  if (key === "databaseProvider") return recommendedDatabaseByHosting[state.hosting.value];
  if (key === "orm") return "drizzle";
  return (createDefaultState() as unknown as Record<string, Decision<unknown>>)[key]?.value;
}

export function recomputeRecommendationsV3(input: WizardStateV3): V3RecommendationResult {
  const state = structuredClone(input);
  const changed: string[] = [];
  const reasons: string[] = [];
  if (state.targetDirectory.value !== state.projectName.value || state.targetDirectory.source !== state.projectName.source) {
    state.targetDirectory = structuredClone(state.projectName);
    changed.push("Target folder");
  }
  if (state.authentication.value === "better-auth") {
    state.authMethods = setRecommended(state.authMethods, ["email-password"], "Sign-in methods", changed);
    state.databaseRequired = setRecommended(state.databaseRequired, true, "Database requirement", changed);
    state.databaseProvider = setRecommended(state.databaseProvider, recommendedDatabaseByHosting[state.hosting.value], "Database provider", changed);
    state.orm = setRecommended(state.orm, "drizzle", "ORM", changed);
    reasons.push("Better Auth requires a database and recommends email/password with Drizzle until the user chooses otherwise.");
  } else {
    state.databaseRequired = setRecommended(state.databaseRequired, false, "Database requirement", changed);
  }
  const supportedDatabases = databaseOptionsByHosting[state.hosting.value];
  if (!supportedDatabases.includes(state.databaseProvider.value)) {
    state.dormant.databaseProvider = state.databaseProvider;
    state.databaseProvider = recommended(recommendedDatabaseByHosting[state.hosting.value]);
    changed.push("Database provider");
  }
  const supportedStorage = storageOptionsByHosting[state.hosting.value];
  if (!supportedStorage.includes(state.storage.value)) {
    state.storage = recommended("none");
    changed.push("Storage");
  }
  reasons.push(`${state.hosting.value} limits database and storage choices to its supported contracts.`);
  return { state, changed, reasons };
}

export function setV3UserDecision<K extends Exclude<keyof WizardStateV3, "version" | "stage" | "dormant">>(state: WizardStateV3, key: K, value: WizardStateV3[K] extends Decision<infer T> ? T : never): V3RecommendationResult {
  const next = structuredClone(state);
  const previousHosting = next.hosting.value;
  (next[key] as Decision<unknown>) = { value, source: "user" };
  if (key === "projectName") next.targetDirectory = { value: String(value), source: "user" };
  if (key === "databaseRequired") {
    if (!value) {
      next.dormant.databaseProvider = next.databaseProvider;
      next.dormant.orm = next.orm;
    } else {
      next.databaseProvider = next.dormant.databaseProvider ?? next.databaseProvider;
      next.orm = next.dormant.orm ?? next.orm;
    }
  }
  if (key === "hosting") {
    next.dormant.hostingChoices ??= {};
    next.dormant.hostingChoices[previousHosting] = { databaseProvider: state.databaseProvider, storage: state.storage };
    const restored = next.dormant.hostingChoices[value as HostingChoice];
    next.databaseProvider = restored?.databaseProvider ?? recommended(recommendedDatabaseByHosting[value as HostingChoice]);
    next.storage = restored?.storage ?? recommended("none");
  }
  return recomputeRecommendationsV3(next);
}

export function useV3Recommendation<K extends Exclude<keyof WizardStateV3, "version" | "stage" | "dormant">>(state: WizardStateV3, key: K): V3RecommendationResult {
  const next = structuredClone(state);
  const defaults = createDefaultState();
  (next[key] as Decision<unknown>) = structuredClone(defaults[key] as Decision<unknown>);
  if (key === "targetDirectory") next.targetDirectory.value = next.projectName.value;
  return recomputeRecommendationsV3(next);
}

function v3Clouds(config: Pick<StarterConfigV3, "databaseRequired" | "databaseProvider" | "storage" | "aiProviders">): Set<string> {
  const lookup: Record<string, string> = {
    "vercel-blob": "Vercel", "vercel-ai-gateway": "Vercel", r2: "Cloudflare",
    "azure-blob": "Azure", "azure-postgresql": "Azure", "azure-openai": "Azure",
    s3: "AWS", "aws-rds": "AWS", bedrock: "AWS", gcs: "GCP", "gcp-cloud-sql": "GCP", vertex: "GCP",
  };
  return new Set([config.storage, config.databaseRequired ? config.databaseProvider ?? "" : "", ...config.aiProviders].flatMap((choice) => lookup[choice] ? [lookup[choice]] : []));
}

export function validateV3Config(config: StarterConfigV3): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (config.version !== 3) errors.push("Blueprint must use schema version 3.");
  if (!isValidProjectName(config.projectName)) errors.push("Project name must use 1–50 lowercase letters, numbers, or hyphens.");
  if (!isValidTargetDirectory(config.targetDirectory)) errors.push("Target folder must be a safe relative path without spaces, backslashes, or parent-directory segments.");
  if (config.targetDirectory !== config.projectName) errors.push("Target folder must match the project name.");
  if (!agents.includes(config.primaryAgent) || !config.additionalAgents.every((agent) => agents.includes(agent))) errors.push("Blueprint includes an unsupported agent.");
  if (!isShadcnPreset(config.shadcnPreset)) errors.push("The shadcn preset is invalid. Import it again from ui.shadcn.com/create.");
  if (config.authentication === "better-auth" && (!config.databaseRequired || !config.databaseProvider || !config.orm || config.authMethods.length === 0)) errors.push("Better Auth requires a database, ORM, and at least one sign-in method.");
  if (!config.databaseRequired && (config.databaseProvider || config.orm)) errors.push("Inactive database choices must be omitted from a v3 blueprint.");
  if (config.databaseRequired && (!config.databaseProvider || !config.orm)) errors.push("Database setup requires a provider and ORM.");
  if (config.databaseRequired && config.databaseProvider && !databaseOptionsByHosting[config.hosting].includes(config.databaseProvider)) errors.push("The selected database is not supported by the selected host.");
  if (!storageOptionsByHosting[config.hosting].includes(config.storage)) errors.push("The selected storage is not supported by the selected host.");
  if (config.ci !== deriveCi(config.codeHost)) errors.push("Blueprint CI does not match its code host.");
  const selectedClouds = v3Clouds(config);
  if (selectedClouds.size > 1) warnings.push(`This selection spans ${[...selectedClouds].join(", ")}. It is supported, but may add latency, credentials, and billing surfaces.`);
  return { errors, warnings };
}

export function validateV3State(state: WizardStateV3): ValidationResult {
  if (state.version !== 3 || !wizardStagesV3.includes(state.stage)) return { errors: ["Builder state is not a v3 state."], warnings: [] };
  return validateV3Config(resolveV3Config(state, false));
}

/** Normalize builder decisions into the portable, source-independent v3 blueprint. */
export function resolveV3Config(state: WizardStateV3, validate = true): StarterConfigV3 {
  const config: StarterConfigV3 = {
    version: 3,
    projectName: state.projectName.value,
    targetDirectory: state.projectName.value,
    primaryAgent: state.primaryAgent.value,
    additionalAgents: [...new Set(state.additionalAgents.value.filter((agent) => agent !== state.primaryAgent.value))],
    packageManager: state.packageManager.value,
    tooling: state.tooling.value,
    codeHost: state.codeHost.value,
    ciEnabled: state.ciEnabled.value,
    ci: deriveCi(state.codeHost.value),
    uiFoundation: state.uiFoundation.value,
    shadcnPreset: structuredClone(state.shadcnPreset.value),
    authentication: state.authentication.value,
    authMethods: state.authentication.value === "better-auth" ? [...new Set(state.authMethods.value)] : [],
    databaseRequired: state.databaseRequired.value,
    ...(state.databaseRequired.value ? { databaseProvider: state.databaseProvider.value, orm: state.orm.value } : {}),
    storage: state.storage.value,
    aiProviders: [...new Set(state.aiProviders.value)],
    hosting: state.hosting.value,
    testing: [state.vitest.value ? "vitest" as const : null, state.playwright.value ? "playwright" as const : null].filter((choice): choice is TestingChoice => choice !== null),
    observability: [state.opentelemetry.value ? "opentelemetry" as const : null, state.sentry.value ? "sentry" as const : null].filter((choice): choice is ObservabilityChoice => choice !== null),
  };
  if (validate) {
    const result = validateV3Config(config);
    if (result.errors.length) throw new Error(result.errors.join(" "));
  }
  return config;
}

function v3Valid(value: unknown, choices: readonly string[]): boolean {
  return typeof value === "string" && choices.includes(value);
}

function v3StringArray(value: unknown, choices: readonly string[]): value is string[] {
  return Array.isArray(value) && value.every((item) => v3Valid(item, choices));
}

/** Decode a breaking v3 blueprint; v1/v2 tokens cannot accidentally invoke the orchestrator. */
export function decodeV3Blueprint(token: string): StarterConfigV3 {
  if (token.length > 32_000) throw new Error("Blueprint token is oversized.");
  if (token.startsWith("v1.") || token.startsWith("v2.")) throw new Error("Blueprint v3 is required. Rebuild this blueprint at https://bishoy.io/start.");
  if (!token.startsWith("v3.")) throw new Error("Unsupported blueprint token.");
  let raw: unknown;
  try { raw = JSON.parse(fromBase64Url(token.slice(3))); } catch { throw new Error("Blueprint token is malformed."); }
  if (!raw || typeof raw !== "object") throw new Error("Blueprint schema is not supported.");
  const candidate = raw as Record<string, unknown>;
  if (candidate.version !== 3 || Object.keys(candidate).some((key) => ![
    "version", "projectName", "targetDirectory", "primaryAgent", "additionalAgents", "packageManager", "tooling", "codeHost", "ciEnabled", "ci", "uiFoundation", "shadcnPreset", "authentication", "authMethods", "databaseRequired", "databaseProvider", "orm", "storage", "aiProviders", "hosting", "testing", "observability",
  ].includes(key))) throw new Error("Blueprint schema is not supported.");
  if (!v3Valid(candidate.projectName, []) && typeof candidate.projectName !== "string") throw new Error("Blueprint contains an invalid project name.");
  if (!v3Valid(candidate.targetDirectory, []) && typeof candidate.targetDirectory !== "string") throw new Error("Blueprint contains an invalid target folder.");
  if (!v3Valid(candidate.primaryAgent, agents) || !v3StringArray(candidate.additionalAgents, agents)
    || !v3Valid(candidate.packageManager, ["npm", "pnpm", "yarn", "bun"])
    || !v3Valid(candidate.tooling, ["biome", "eslint-prettier"])
    || !v3Valid(candidate.codeHost, ["github", "gitlab", "azure-devops", "undecided"])
    || typeof candidate.ciEnabled !== "boolean"
    || !v3Valid(candidate.ci, ["github-actions", "gitlab-ci", "azure-pipelines"])
    || !v3Valid(candidate.uiFoundation, ["base-ui", "radix-ui"])
    || !isShadcnPreset(candidate.shadcnPreset)
    || !v3Valid(candidate.authentication, ["none", "better-auth"])
    || !v3StringArray(candidate.authMethods, ["email-password", "github", "google", "microsoft"])
    || typeof candidate.databaseRequired !== "boolean"
    || !v3Valid(candidate.storage, ["none", "vercel-blob", "s3", "r2", "azure-blob", "gcs", "supabase-storage"])
    || !v3StringArray(candidate.aiProviders, ["openai", "anthropic", "google", "azure-openai", "bedrock", "vertex", "vercel-ai-gateway"])
    || !v3Valid(candidate.hosting, ["vercel", "cloudflare", "azure", "aws", "gcp", "docker"])
    || !v3StringArray(candidate.testing, ["vitest", "playwright"])
    || !v3StringArray(candidate.observability, ["opentelemetry", "sentry"])) throw new Error("Blueprint contains an unsupported configuration value.");
  if (candidate.databaseProvider !== undefined && !v3Valid(candidate.databaseProvider, ["neon", "supabase", "docker", "existing-url", "azure-postgresql", "aws-rds", "gcp-cloud-sql"])) throw new Error("Blueprint contains an unsupported database provider.");
  if (candidate.orm !== undefined && !v3Valid(candidate.orm, ["drizzle", "prisma"])) throw new Error("Blueprint contains an unsupported ORM.");
  const config = candidate as unknown as StarterConfigV3;
  const result = validateV3Config(config);
  if (result.errors.length) throw new Error(result.errors.join(" "));
  return config;
}

export function encodeV3Blueprint(config: StarterConfigV3): string {
  const result = validateV3Config(config);
  if (result.errors.length) throw new Error(result.errors.join(" "));
  return `v3.${toBase64Url(JSON.stringify(config))}`;
}

function commandLauncher(packageManager: PackageManager): string {
  return { npm: "npx --yes", pnpm: "pnpm dlx", yarn: "yarn dlx", bun: "bunx" }[packageManager];
}

function packageLauncherForPlan(config: Pick<StarterConfigV3, "packageManager">): string {
  return { npm: "npx", pnpm: "pnpm exec", yarn: "yarn exec", bun: "bunx" }[config.packageManager];
}

export function buildV3StarterCommand(config: StarterConfigV3, options: { planOnly?: boolean } = {}): string {
  return `${commandLauncher(config.packageManager)} @bishoymly/start@latest ${config.projectName} --blueprint ${encodeV3Blueprint(config)}${options.planOnly ? " --plan" : ""}`;
}

function agentSet(config: StarterConfigV3): AgentId[] {
  return [config.primaryAgent, ...config.additionalAgents];
}

function environmentForV3(config: StarterConfigV3): EnvironmentContract[] {
  const result: EnvironmentContract[] = [];
  const add = (name: string, purpose: string, required: boolean, capability: string) => result.push({ name, purpose, required, capability });
  if (config.databaseRequired) add("DATABASE_URL", "Connection string for the selected database.", true, "database");
  if (config.authentication === "better-auth") {
    add("BETTER_AUTH_SECRET", "Secret used to sign authentication sessions.", true, "authentication");
    add("BETTER_AUTH_URL", "Public base URL used by Better Auth.", true, "authentication");
    for (const method of config.authMethods) {
      const key = method === "email-password" ? null : method.toUpperCase();
      if (key) { add(`${key}_CLIENT_ID`, `${method} OAuth client ID.`, true, "authentication"); add(`${key}_CLIENT_SECRET`, `${method} OAuth client secret.`, true, "authentication"); }
    }
  }
  const storage: Partial<Record<StorageChoice, [string, string][]>> = {
    "vercel-blob": [["BLOB_READ_WRITE_TOKEN", "Vercel Blob token."]], s3: [["S3_BUCKET", "S3 bucket name."], ["AWS_REGION", "AWS region."], ["AWS_ACCESS_KEY_ID", "AWS access key ID."], ["AWS_SECRET_ACCESS_KEY", "AWS secret access key."]], r2: [["R2_BUCKET", "Cloudflare R2 bucket name."], ["R2_ENDPOINT", "Cloudflare R2 endpoint."], ["R2_ACCESS_KEY_ID", "R2 access key ID."], ["R2_SECRET_ACCESS_KEY", "R2 secret access key."]], "azure-blob": [["AZURE_STORAGE_CONNECTION_STRING", "Azure Blob connection string."]], gcs: [["GCS_BUCKET", "Google Cloud Storage bucket name."], ["GOOGLE_APPLICATION_CREDENTIALS", "Google service-account credential path."]], "supabase-storage": [["SUPABASE_URL", "Supabase project URL."], ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key."]],
  };
  for (const [name, purpose] of storage[config.storage] ?? []) add(name, purpose, true, "storage");
  const ai: Partial<Record<AiProvider, [string, string][]>> = { openai: [["OPENAI_API_KEY", "OpenAI API key."]], anthropic: [["ANTHROPIC_API_KEY", "Anthropic API key."]], google: [["GOOGLE_GENERATIVE_AI_API_KEY", "Google AI API key."]], "azure-openai": [["AZURE_OPENAI_API_KEY", "Azure OpenAI API key."], ["AZURE_OPENAI_RESOURCE_NAME", "Azure OpenAI resource name."]], bedrock: [["AWS_REGION", "AWS region for Bedrock."]], vertex: [["GOOGLE_CLOUD_PROJECT", "Google Cloud project for Vertex AI."]], "vercel-ai-gateway": [["AI_GATEWAY_API_KEY", "Vercel AI Gateway API key."]] };
  for (const provider of config.aiProviders) for (const [name, purpose] of ai[provider] ?? []) add(name, purpose, true, "ai");
  if (config.observability.includes("opentelemetry")) add("OTEL_EXPORTER_OTLP_ENDPOINT", "OpenTelemetry collector endpoint.", false, "opentelemetry");
  if (config.observability.includes("sentry")) { add("SENTRY_DSN", "Sentry DSN.", true, "sentry"); add("SENTRY_AUTH_TOKEN", "Sentry release-upload token.", false, "sentry"); }
  return result;
}

function capabilitiesForV3(config: StarterConfigV3): CapabilityContract[] {
  const result: CapabilityContract[] = [];
  const add = (id: string, description: string, requires: string[]) => result.push({ id, status: "available", description, requires, excludesProductBehavior: true });
  if (config.databaseRequired) add("database", `Empty ${config.orm} schema, client, and migration configuration for ${config.databaseProvider}.`, ["DATABASE_URL"]);
  if (config.authentication === "better-auth") add("authentication", "Better Auth framework plumbing and server-side session helpers only.", ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]);
  if (config.storage !== "none") add("storage", `${config.storage} SDK and environment contract only.`, environmentForV3(config).filter((entry) => entry.capability === "storage").map((entry) => entry.name));
  for (const provider of config.aiProviders) add(`ai:${provider}`, `${provider} SDK and environment contract only.`, environmentForV3(config).filter((entry) => entry.capability === "ai").map((entry) => entry.name));
  for (const provider of config.observability) add(provider, `${provider} initialization and configuration only.`, environmentForV3(config).filter((entry) => entry.capability === provider).map((entry) => entry.name));
  return result;
}

/** Build the exact ordered, serializable contract shared by plan preview and execution. */
export function buildExecutionPlan(config: StarterConfigV3): ExecutionPlanV3 {
  const validation = validateV3Config(config);
  if (validation.errors.length) throw new Error(validation.errors.join(" "));
  const base = config.uiFoundation === "base-ui" ? "base" : "radix";
  const launcher = commandLauncher(config.packageManager);
  const skillRoot: Record<AgentId, string> = {
    codex: ".agents/skills", "claude-code": ".claude/skills", cursor: ".cursor/skills", "github-copilot": ".github/skills",
    "gemini-cli": ".gemini/skills", opencode: ".opencode/skills", windsurf: ".windsurf/skills", "grok-build": ".grok/skills",
  };
  // The Skills CLI's --agent switch makes ownership explicit: a selected agent
  // receives its native project-local skill directory, not a generic copy.
  const skills = agentSet(config).flatMap((agent) => [
    { id: `design-taste-frontend-${agent}`, source: "leonxlnx/taste-skill", agents: [agent], projectScope: true, expectedPaths: [`${skillRoot[agent]}/design-taste-frontend/SKILL.md`], installCommand: `${launcher} skills add leonxlnx/taste-skill --skill design-taste-frontend --agent ${agent} --yes` },
    { id: `next-dev-loop-${agent}`, source: "vercel/next.js", agents: [agent], projectScope: true, expectedPaths: [`${skillRoot[agent]}/next-dev-loop/SKILL.md`], installCommand: `${launcher} skills add vercel/next.js --skill next-dev-loop --agent ${agent} --yes` },
    { id: `agent-browser-${agent}`, source: "vercel-labs/agent-browser", agents: [agent], projectScope: true, expectedPaths: [`${skillRoot[agent]}/agent-browser/SKILL.md`], installCommand: `${launcher} skills add vercel-labs/agent-browser --skill agent-browser --agent ${agent} --yes` },
  ] satisfies SkillContract[]);
  const capabilities = capabilitiesForV3(config);
  const steps: ExecutionPlanStep[] = [
    { id: "official-shadcn-init", kind: "official-command", owner: "official", title: "Initialize the official shadcn template", description: "Runs the documented upstream CLI non-interactively and preserves every file it creates.", command: { command: `${launcher} shadcn@latest init --name ${config.projectName} --template next --base ${base} --preset ${config.shadcnPreset.code} --no-monorepo --yes`, postcondition: "absent", conflictPolicy: "prompt", affectedPaths: ["app", "components", "components.json", "package.json"] } },
    { id: "record-start-state", kind: "start-configuration", owner: "start", title: "Record Start v3 template state", description: "Records the selected official template contract so only a prior Start run can be resumed.", operations: ["write .start/v3-state.json"] },
    { id: "start-project-contracts", kind: "start-configuration", owner: "start", title: "Write project contracts", description: "Writes the execution plan, environment contract, tooling manifest, and readiness guidance owned by Start.", operations: ["write START_PLAN.md", "write START_ENVIRONMENT.md", "write .env.example", "write start-tooling.json"] },
    { id: "start-agent-instructions", kind: "start-configuration", owner: "start", title: "Add durable agent instructions", description: "Adds AGENTS.md and selected native agent entry points; instructions require waiting for PRD or requirements.", operations: ["write AGENTS.md", "write selected native agent entry points"] },
    { id: "start-quality", kind: "start-configuration", owner: "start", title: "Configure quality and browser verification", description: "Adds strict TypeScript, selected formatter/linter, Vitest, Playwright, browser guidance, and one verify command without changing official UI output.", operations: ["configure TypeScript", "configure formatter and linter", "configure tests", "configure verify command"] },
    ...(config.ciEnabled ? [{ id: "start-ci", kind: "start-configuration" as const, owner: "start" as const, title: "Configure CI", description: `Adds ${config.ci} to run the same verify command used locally.`, operations: ["write CI workflow"] }] : []),
    ...capabilities.map((capability) => ({ id: `capability-${capability.id.replaceAll(":", "-")}`, kind: "start-configuration" as const, owner: "start" as const, title: `Configure ${capability.id}`, description: capability.description, operations: ["add dependency and framework configuration", "document environment contract"], capabilities: [capability.id] })),
    { id: "install-project-skills", kind: "skill-install", owner: "official", title: "Install selected project skills", description: "Uses the official Skills CLI at project scope and verifies installer-produced files and provenance.", operations: skills.map((skill) => skill.installCommand) },
    { id: "install-dependencies", kind: "official-command", owner: "user", title: "Install project dependencies", description: "Installs the exact dependency graph after Start-owned manifests are in place.", command: { command: { npm: "npm install", pnpm: "pnpm install --no-frozen-lockfile", yarn: "yarn install", bun: "bun install" }[config.packageManager], postcondition: "absent", conflictPolicy: "preserve", affectedPaths: ["node_modules"] } },
    { id: "format-generated-source", kind: "official-command", owner: "start", title: "Format generated source", description: "Formats the fresh upstream starter with the selected formatter before readiness verification.", command: { command: `${config.packageManager} run format`, postcondition: "absent", conflictPolicy: "preserve", affectedPaths: [] } },
    ...(config.testing.includes("playwright") ? [{ id: "install-browser", kind: "official-command" as const, owner: "official" as const, title: "Install Playwright Chromium", description: "Installs the browser required by the selected browser verification suite.", command: { command: `${packageLauncherForPlan(config)} playwright install chromium`, postcondition: "absent" as const, conflictPolicy: "preserve" as const, affectedPaths: [] } }] : []),
    { id: "verify-readiness", kind: "verification", owner: "start", title: "Verify repository readiness", description: "Runs formatting, linting, typecheck, unit tests, Playwright, production build, and records a readiness report.", command: { command: `${config.packageManager} run verify`, postcondition: "absent", conflictPolicy: "preserve", affectedPaths: ["START_READINESS.md"] } },
    { id: "record-readiness", kind: "start-configuration", owner: "start", title: "Write readiness report", description: "Records resolved installed versions, warnings, verification, and whether readiness is actually complete.", operations: ["write START_READINESS.md"] },
    { id: "initialize-git", kind: "official-command", owner: "user", title: "Initialize Git repository", description: "Initializes main when the target is not already inside a Git worktree.", command: { command: "git init --initial-branch=main", postcondition: "absent", conflictPolicy: "preserve", affectedPaths: [".git"] } },
  ];
  return { version: 3, blueprint: encodeV3Blueprint(config), steps, skills, environment: environmentForV3(config), capabilities, verification: { command: `${config.packageManager} run verify`, checks: ["format", "lint", "typecheck", "unit tests", "Playwright", "production build"], awaitRequirements: true }, warnings: [...validation.warnings, "Repository readiness is complete only after verification succeeds. Await a PRD or requirements before product work."] };
}

/** Alias for consumers that use a noun-style API. */
export const createExecutionPlan = buildExecutionPlan;
