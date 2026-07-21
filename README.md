# SynthoniaHub — Assistente WhatsApp per preventivi

Sistema di automazione per **Synthonia** (intrattenimento musicale per matrimoni,
feste ed eventi): risponde subito ai clienti che scrivono su WhatsApp, raccoglie
i dettagli dell'evento e prepara la richiesta di preventivo. **Il prezzo lo decidi
sempre tu, e sei tu a inviare il preventivo**: il sistema ti notifica su WhatsApp,
tu rispondi con il prezzo e ricevi testo e PDF già pronti, che copi/allega e mandi
al cliente come preferisci (con eventuale disponibilità, extra o listino a voce).

## Come funziona

```
Cliente su WhatsApp ──▶ Il bot raccoglie: tipo evento, data, luogo,
                        ospiti, servizi, durata, richieste speciali
                              │ quando è tutto completo
                              ▼
Titolare su WhatsApp ◀── NUOVA RICHIESTA DI PREVENTIVO #42 (riepilogo)
        │
        │  42 prezzo 900      → testo pronto da copiare + link al PDF
        │  42 nota <testo>    → aggiunge una riga al preventivo (opzionale)
        ▼
Titolare invia lui stesso il preventivo al cliente su WhatsApp
(può allegare il PDF, aggiungere disponibilità, extra del pacchetto...)
        │
        │  42 inviato         → registra che il preventivo è stato mandato
        ▼
Cliente riceve il preventivo con link di conferma
        │  clic sul link (o QR code sul PDF) → accetta il preventivo
        ▼
Titolare ◀── PREVENTIVO #42 CONFERMATO   (richiesta segnata "vinta" in automatico)
```

Regole fisse del bot: **mai prezzi o stime** (ogni preventivo è su misura), mai
disponibilità inventate, **mai invii al cliente per conto del titolare**.

## Conferma del preventivo con un clic

Il testo che ricevi con `42 prezzo <importo>` include già un **link di conferma**
univoco, e il PDF scaricabile lo stesso link come QR code. Quando il cliente lo
apre vede il riepilogo con il totale e un pulsante: al clic, la richiesta passa
in automatico a **"vinta"** nel database e **ricevi la notifica su WhatsApp** con
nome ed eventuali note del cliente — senza che tu debba scrivere `42 vinto` a mano.

- La pagina di conferma è servita da `GET/POST /conferma/<token>`; il token è
  casuale e non rivela l'id progressivo della richiesta.
- Il PDF si scarica da `GET /preventivo/<token>` (stesso token, stessa pagina
  protetta) — apri il link, salva il file e allegalo tu su WhatsApp.
- La conferma è **idempotente**: un secondo clic non registra nulla di nuovo e
  non ti invia una seconda notifica.
- Puoi comunque chiudere la richiesta a mano (`42 vinto` / `42 perso`) come prima.
- Il PDF del preventivo si genera con la stessa formattazione dei messaggi
  (`src/quote/pdf.ts`); il link nel PDF punta a `PUBLIC_BASE_URL` (sotto).

## Due modalità di conversazione (scegli tu)

Il "cervello" che parla col cliente è configurabile in base alla presenza di una
chiave API in `.env`. Tutto il resto (comandi del titolare, invio preventivi,
database) è identico nelle due modalità.

| | **Flusso guidato** (predefinito) | **AI conversazionale** |
|---|---|---|
| Come si attiva | Nessuna chiave: è il default | Imposta `ANTHROPIC_API_KEY` in `.env` |
| Costo | Solo hosting | ~1-3 centesimi a preventivo |
| Conversazione | Domande in sequenza; estrae data, ospiti, servizi, durata dal testo | Linguaggio naturale: capisce testo libero e ordine sparso, risponde a domande fuori schema |
| Dipendenze esterne | Nessuna | API Anthropic |

**Per attivare la modalità AI** (opzionale): crea una chiave su
[console.anthropic.com](https://console.anthropic.com/) → *API Keys* → *Create Key*,
carica un piccolo credito, e incolla la chiave in `.env` come `ANTHROPIC_API_KEY`.
All'avvio il sistema (e il simulatore) ti dice quale modalità è attiva.

### Comandi del titolare

| Comando | Effetto |
|---|---|
| `42 prezzo 900` (anche `€900`, `900,50`, `1.200`) | imposta il prezzo e genera testo + link PDF pronti da inviare tu |
| `42 nota Include tecnico del suono` | aggiunge una riga informativa al preventivo, rigenera l'anteprima |
| `42 ok` (o `42 inviato`) | registra che hai già mandato il preventivo al cliente — **non invia nulla** |
| `42 rifiuta <motivo?>` | declina con messaggio cortese al cliente (questo lo manda il bot) |
| `42 vinto` / `42 perso` | chiude la richiesta dopo l'esito |
| `lista` | elenca le richieste aperte |

I comandi funzionano sempre. In modalità AI puoi anche scrivere in linguaggio
naturale ("per il matrimonio di Giulia direi 900 euro") e il sistema lo
interpreta; in modalità guidata usa i comandi qui sopra.

**Solo il rifiuto (`rifiuta`) viene inviato in automatico al cliente.** Il
preventivo vero e proprio no: lo mandi sempre tu, così puoi allegare il PDF,
proporre disponibilità reali o servizi extra non gestiti dal bot.

## Provalo subito senza WhatsApp (simulatore)

Serve solo Node.js ≥ 22. La chiave API è **facoltativa** (senza, parte il flusso
guidato gratuito).

```bash
npm install
cp .env.example .env        # ANTHROPIC_API_KEY opzionale (vuoto = flusso guidato)
npm run simulate
```

Nel simulatore scrivi come cliente; `/owner` ti trasforma nel titolare,
`/customer` di nuovo in cliente, `/state` mostra il database, `/reset` azzera.
Lo scenario passo-passo completo è in [`test/e2e-scenario.md`](test/e2e-scenario.md).

Test automatici (senza chiave API): `npm test` — firma webhook, state machine,
comandi titolare, flusso di approvazione, endpoint webhook, e conferma del
preventivo (token, pagina, notifica al titolare, generazione PDF).

## Provalo sul numero WhatsApp vero, ma in locale (tunnel)

Vuoi vedere il bot rispondere sul numero business reale **senza ancora un
hosting**? Puoi tenere il server sul tuo computer ed esporlo con un tunnel
gratuito. Due guide passo-passo:

- **[Cloudflare Tunnel](docs/test-locale-cloudflare.md)** — per un test veloce non serve alcun account
- **[ngrok](docs/test-locale-ngrok.md)** — alternativa, richiede un account gratuito

È perfetto per la prima prova; per l'uso quotidiano dell'azienda serve però un
hosting sempre acceso (sotto).

## Messa in produzione

### 1. Prerequisiti Meta (una tantum, ~1 ora)

Serve un numero di telefono **dedicato** al business (non puoi usare il numero
già registrato sull'app WhatsApp/WhatsApp Business del telefono).

Guida completa passo-passo (con screenshot dei menù e i problemi comuni):
**[`docs/setup-meta.md`](docs/setup-meta.md)**. In sintesi:

1. Crea un account [Meta Business](https://business.facebook.com/) e verifica l'azienda.
2. Su [developers.facebook.com](https://developers.facebook.com/) crea un'app di tipo **Business** e aggiungi il prodotto **WhatsApp**.
3. Per i primi test Meta ti dà un **numero di prova** (funziona solo verso massimo 5 numeri verificati — perfetto per provare). Poi registra il tuo numero reale in *WhatsApp → API Setup*.
4. Genera un **token permanente**: *Business Settings → Users → System Users* → crea un system user, assegnagli l'app e genera un token con permesso `whatsapp_business_messaging`. → `WHATSAPP_TOKEN`
5. Copia il **Phone number ID** da *WhatsApp → API Setup*. → `PHONE_NUMBER_ID`
6. Copia l'**App Secret** da *App Settings → Basic*. → `APP_SECRET`
7. Scegli tu una stringa segreta qualsiasi. → `VERIFY_TOKEN`

### 2. Hosting

Il server è un unico processo Node con database SQLite su disco: serve un
hosting sempre acceso con **disco persistente** e **HTTPS pubblico**.

- **[Railway](https://railway.app/)** (consigliato): collega il repo GitHub, aggiungi un *Volume* montato su `/app/data`, imposta le variabili d'ambiente, deploy automatico a ogni push. ~5$/mese.
- Alternative equivalenti: [Render](https://render.com/) (con persistent disk), [Fly.io](https://fly.io/) (con volume), oppure un VPS con systemd + Caddy/nginx per l'HTTPS.

Variabili d'ambiente da impostare (vedi `.env.example`): `WHATSAPP_TOKEN`,
`PHONE_NUMBER_ID`, `VERIFY_TOKEN`, `APP_SECRET`, `OWNER_PHONE` (il tuo numero,
es. `393401234567`), `DB_PATH=/app/data/synthonia.db`, e `PUBLIC_BASE_URL` con
l'URL HTTPS pubblico dell'host (es. `https://synthonia.up.railway.app`): è
l'indirizzo che finisce nei link di conferma, quindi deve essere quello reale
raggiungibile dai clienti, **non** `localhost`. `ANTHROPIC_API_KEY` è opzionale:
impostala solo se vuoi la modalità AI conversazionale.

Avvio: `npm run start` (il process manager della piattaforma lo tiene attivo).

### 3. Collega il webhook

Nella dashboard Meta, *WhatsApp → Configuration → Webhook*:

- **Callback URL**: `https://<il-tuo-host>/webhook`
- **Verify token**: lo stesso valore di `VERIFY_TOKEN`
- Clicca *Verify and save* (il server risponde alla verifica automaticamente)
- Sottoscrivi il campo **messages**

Da questo momento i messaggi al numero business arrivano al bot. Scrivi
`lista` dal tuo numero (`OWNER_PHONE`) per verificare che tutto funzioni.

### Limitazione nota: finestra di 24 ore

WhatsApp permette messaggi liberi solo entro **24 ore dall'ultimo messaggio del
cliente**. Il bot risponde sempre subito, quindi il problema non si pone per la
conversazione; ma se approvi un preventivo **più di 24 ore dopo** l'ultimo
messaggio del cliente, Meta rifiuta l'invio. Soluzioni: approva entro la
giornata (caso normale), oppure ricontatta il cliente con un *template message*
approvato da Meta (non incluso in questa versione).

### Backup

Il database è un singolo file SQLite. Backup giornaliero consigliato:

```bash
sqlite3 /app/data/synthonia.db ".backup /app/data/backup-$(date +%F).db"
```

## Struttura del progetto

```
src/
├── index.ts                 # entrypoint del server WhatsApp
├── config.ts                # validazione .env + profilo aziendale + scelta modalità
├── server/
│   ├── app.ts              # Express: monta webhook + pagina di conferma
│   ├── webhook.ts          # verifica webhook Meta + firma HMAC
│   └── confirm.ts          # pagina pubblica /conferma/<token> (accettazione cliente)
├── quote/
│   ├── pdf.ts              # genera il PDF del preventivo con link + QR di conferma
│   └── confirm-page.ts     # HTML della pagina di conferma
├── core/
│   ├── router.ts            # smista i messaggi (titolare vs cliente), sceglie il motore
│   ├── guided-conversation.ts    # flusso guidato deterministico (no API)
│   ├── customer-conversation.ts  # turno AI conversazionale (con API Claude)
│   ├── owner-commands.ts    # parser dei comandi del titolare (regex)
│   ├── owner-flow.ts        # notifica, esecuzione comandi, invio preventivo
│   ├── state-machine.ts     # collecting_info → pending_owner → quoted → won/lost
│   └── templates.ts         # tutti i messaggi in italiano
├── ai/                      # solo modalità AI: client Claude, system prompt, tool
├── db/                      # SQLite: richieste, messaggi, migrazioni
├── whatsapp/                # Meta Cloud API: invio, firma, parsing payload
└── simulator/               # REPL per provare tutto senza WhatsApp
config/business.json         # servizi, FAQ, zona, tono: personalizzalo!
```

## Personalizzazione

- **Profilo aziendale**: modifica `config/business.json` (servizi, FAQ, zona coperta, tono).
- **Testi e domande**: tutti in `src/core/templates.ts` (domande dell'intervista, preventivo, rifiuto, notifiche).
- **Regole di estrazione** (flusso guidato): `src/core/guided-conversation.ts` (date, ospiti, servizi, durata).
- **Modello AI** (solo modalità AI): `ANTHROPIC_MODEL` in `.env` (default `claude-opus-4-8`).

## Roadmap (non incluso in questa versione)

- Messaggi vocali e immagini dei clienti
- Template message per ricontattare oltre le 24 ore
- Promemoria automatici per richieste senza risposta
- Dashboard web di riepilogo
