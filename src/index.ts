import { assertWhatsAppConfig, loadConfig } from "./config.js";
import { openDatabase } from "./db/database.js";
import {
  MessageRepository,
  QuoteRequestRepository,
} from "./db/repositories.js";
import { Router } from "./core/router.js";
import { MetaProvider } from "./whatsapp/meta-provider.js";
import { createApp } from "./server/app.js";

const config = loadConfig();
assertWhatsAppConfig(config);

const db = openDatabase(config.dbPath);
const quoteRepo = new QuoteRequestRepository(db);
const messageRepo = new MessageRepository(db);
const provider = new MetaProvider(config.whatsappToken!, config.phoneNumberId!);
const router = new Router({ config, quoteRepo, messageRepo, provider });

const app = createApp(config, router, {
  config,
  quoteRepo,
  messageRepo,
  provider,
});
app.listen(config.port, () => {
  console.log(`SynthoniaHub in ascolto sulla porta ${config.port}`);
  console.log(`Webhook: POST /webhook — verifica: GET /webhook`);
  console.log(`Conferma preventivi: ${config.publicBaseUrl}/conferma/<token>`);
});
