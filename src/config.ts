import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";

const businessSchema = z.object({
  name: z.string(),
  description: z.string(),
  coverage_area: z.string(),
  services: z.array(
    z.object({ id: z.string(), label: z.string(), description: z.string() }),
  ),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  tone: z.string(),
});

export type BusinessProfile = z.infer<typeof businessSchema>;

const envSchema = z.object({
  // Required for the AI conversation (simulator + server)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-4-8"),
  // Required only when running the real WhatsApp server
  WHATSAPP_TOKEN: z.string().optional(),
  PHONE_NUMBER_ID: z.string().optional(),
  VERIFY_TOKEN: z.string().optional(),
  APP_SECRET: z.string().optional(),
  OWNER_PHONE: z.string().default("390000000000"),
  PORT: z.coerce.number().default(3000),
  DB_PATH: z.string().default("./data/synthonia.db"),
});

export interface AppConfig {
  /** True when ANTHROPIC_API_KEY is set: the bot uses AI conversation instead of the guided flow. */
  aiEnabled: boolean;
  anthropicModel: string;
  whatsappToken: string | undefined;
  phoneNumberId: string | undefined;
  verifyToken: string | undefined;
  appSecret: string | undefined;
  ownerPhone: string;
  port: number;
  dbPath: string;
  business: BusinessProfile;
}

const here = path.dirname(fileURLToPath(import.meta.url));

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const e = parsed.data;

  const businessPath = path.resolve(here, "../config/business.json");
  const business = businessSchema.parse(
    JSON.parse(readFileSync(businessPath, "utf-8")),
  );

  return {
    aiEnabled: Boolean(e.ANTHROPIC_API_KEY && e.ANTHROPIC_API_KEY.length > 0),
    anthropicModel: e.ANTHROPIC_MODEL,
    whatsappToken: e.WHATSAPP_TOKEN,
    phoneNumberId: e.PHONE_NUMBER_ID,
    verifyToken: e.VERIFY_TOKEN,
    appSecret: e.APP_SECRET,
    ownerPhone: normalizePhone(e.OWNER_PHONE),
    port: e.PORT,
    dbPath: e.DB_PATH,
    business,
  };
}

/** Ensures the WhatsApp server has every credential it needs; throws a clear error otherwise. */
export function assertWhatsAppConfig(config: AppConfig): void {
  const missing: string[] = [];
  if (!config.whatsappToken) missing.push("WHATSAPP_TOKEN");
  if (!config.phoneNumberId) missing.push("PHONE_NUMBER_ID");
  if (!config.verifyToken) missing.push("VERIFY_TOKEN");
  if (!config.appSecret) missing.push("APP_SECRET");
  if (missing.length > 0) {
    throw new Error(
      `Missing WhatsApp credentials in .env: ${missing.join(", ")}.\n` +
        "See README.md for the Meta setup steps, or run `npm run simulate` to try the bot without WhatsApp.",
    );
  }
}

/** Normalizes a phone number to digits only (Meta sends numbers without '+'). */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}
