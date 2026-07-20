import { writeFileSync } from "node:fs";
import { loadConfig } from "./src/config.js";
import { openDatabase } from "./src/db/database.js";
import { QuoteRequestRepository } from "./src/db/repositories.js";
import { generateQuotePdf, confirmationUrl } from "./src/quote/pdf.js";

const config = loadConfig({
  DB_PATH: ":memory:",
  PUBLIC_BASE_URL: "https://preventivi.synthonia.it",
} as NodeJS.ProcessEnv);

const db = openDatabase(":memory:");
const repo = new QuoteRequestRepository(db);

const created = repo.findOrCreateActive("393331234567");
repo.patch(created.id, {
  customer_name: "Maria Rossi",
  event_type: "matrimonio",
  event_date: "2026-09-12",
  event_date_raw: "12 settembre 2026",
  location: "Villa Reale, Monza",
  guest_count: 120,
  services: ["dj_set", "musica_live", "luci"],
  duration_hours: 6,
  special_requests: "Primo ballo su 'At Last' di Etta James",
  price_eur: 1850,
  owner_notes:
    "Include allestimento luci architetturali e service audio dedicato per la cerimonia.",
});
repo.transition(created.id, "pending_owner");
repo.transition(created.id, "quoted");
const token = repo.ensureConfirmationToken(created.id);

const pdf = await generateQuotePdf({
  request: repo.getById(created.id)!,
  business: config.business,
  confirmUrl: confirmationUrl(config.publicBaseUrl, token),
  now: new Date("2026-07-21T10:00:00Z"),
});

const out = process.argv[2] ?? "./preventivo-esempio.pdf";
writeFileSync(out, pdf);
console.log(`PDF scritto in ${out} (${pdf.length} byte)`);
