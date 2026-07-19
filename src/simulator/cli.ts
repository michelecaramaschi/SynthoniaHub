/**
 * Interactive simulator: try the whole quote flow without WhatsApp credentials.
 *
 *   npm run simulate
 *
 * You start as a customer. Commands:
 *   /owner          switch to the owner identity
 *   /customer [n]   switch back to customer n (default 1)
 *   /state          dump the active quote request row
 *   /reset          wipe the dev database
 *   /exit           quit
 * Anything else is sent as a WhatsApp message from the current identity.
 *
 * Requires only ANTHROPIC_API_KEY in the environment (or an `ant auth login` profile).
 */
import readline from "node:readline";
import { rmSync } from "node:fs";
import { loadConfig } from "../config.js";
import { openDatabase } from "../db/database.js";
import {
  MessageRepository,
  QuoteRequestRepository,
} from "../db/repositories.js";
import { Router } from "../core/router.js";
import { ConsoleProvider } from "./console-provider.js";

const SIMULATOR_DB = "./data/simulator.db";

const config = loadConfig();
let db = openDatabase(SIMULATOR_DB);
let quoteRepo = new QuoteRequestRepository(db);
let messageRepo = new MessageRepository(db);
let router = new Router({
  config,
  quoteRepo,
  messageRepo,
  provider: new ConsoleProvider(config.ownerPhone),
});

function customerPhone(n: number): string {
  return `39000000000${n}`;
}

let identity: { kind: "customer" | "owner"; phone: string } = {
  kind: "customer",
  phone: customerPhone(1),
};

console.log("🎧 Simulatore SynthoniaHub");
console.log(
  `Modalità conversazione: ${config.aiEnabled ? "AI (Claude)" : "flusso guidato (nessuna API)"}`,
);
console.log("Scrivi come cliente, oppure usa /owner, /customer [n], /state, /reset, /exit.");
console.log(`Identità attuale: cliente +${identity.phone}\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(): void {
  const label =
    identity.kind === "owner" ? "titolare" : `cliente +${identity.phone}`;
  rl.setPrompt(`[${label}] > `);
  rl.prompt();
}

// Process lines strictly in order, and drain the queue before exiting.
let pending: Promise<void> = Promise.resolve();
rl.on("line", (line) => {
  pending = pending.then(() => handleLine(line.trim())).finally(prompt);
});
rl.on("close", () => {
  void pending.finally(() => process.exit(0));
});
prompt();

async function handleLine(line: string): Promise<void> {
  if (!line) return;

  if (line === "/exit") {
    rl.close();
    return;
  }
  if (line === "/owner") {
    identity = { kind: "owner", phone: config.ownerPhone };
    console.log("Ora scrivi come TITOLARE.");
    return;
  }
  if (line.startsWith("/customer")) {
    const n = Number(line.split(/\s+/)[1] ?? "1") || 1;
    identity = { kind: "customer", phone: customerPhone(n) };
    console.log(`Ora scrivi come cliente +${identity.phone}.`);
    return;
  }
  if (line === "/state") {
    const requests = quoteRepo.listByStatus([
      "collecting_info",
      "pending_owner",
      "quoted",
      "won",
      "lost",
    ]);
    console.log(JSON.stringify(requests, null, 2));
    return;
  }
  if (line === "/reset") {
    db.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${SIMULATOR_DB}${suffix}`, { force: true });
    }
    db = openDatabase(SIMULATOR_DB);
    quoteRepo = new QuoteRequestRepository(db);
    messageRepo = new MessageRepository(db);
    router = new Router({
      config,
      quoteRepo,
      messageRepo,
      provider: new ConsoleProvider(config.ownerPhone),
    });
    console.log("Database del simulatore azzerato.");
    return;
  }

  try {
    await router.handleInbound({
      from: identity.phone,
      text: line,
      waMessageId: null,
      profileName: null,
    });
  } catch (error) {
    console.error("Errore:", error);
  }
}
