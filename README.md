# SynthoniaHub — Assistente WhatsApp per preventivi

Sistema di automazione per **Synthonia** (intrattenimento musicale per matrimoni,
feste ed eventi): risponde subito ai clienti che scrivono su WhatsApp, raccoglie
i dettagli dell'evento con un assistente AI in italiano e prepara la richiesta di
preventivo. **Il prezzo lo decidi sempre tu**: il sistema ti notifica su WhatsApp,
tu rispondi con il prezzo, controlli l'anteprima e approvi l'invio.

## Come funziona

```
Cliente su WhatsApp ──▶ Bot AI (Claude) raccoglie: tipo evento, data, luogo,
                        ospiti, servizi, durata, richieste speciali
                              │ quando è tutto completo
                              ▼
Titolare su WhatsApp ◀── 🎧 NUOVA RICHIESTA DI PREVENTIVO #42 (riepilogo)
        │
        │  42 prezzo 900      → anteprima del preventivo
        │  42 nota <testo>    → aggiunge una riga al preventivo (opzionale)
        │  42 ok              → il preventivo parte verso il cliente
        ▼
Cliente riceve il preventivo formattato ──▶  42 vinto / 42 perso
```

Regole fisse del bot: **mai prezzi o stime** (ogni preventivo è su misura), mai
disponibilità inventate, risponde alle FAQ solo dal profilo aziendale
(`config/business.json`).

### Comandi del titolare

| Comando | Effetto |
|---|---|
| `42 prezzo 900` (anche `€900`, `900,50`, `1.200`) | imposta il prezzo e mostra l'anteprima |
| `42 nota Include tecnico del suono` | aggiunge una riga informativa al preventivo |
| `42 ok` | invia il preventivo al cliente |
| `42 rifiuta <motivo?>` | declina con messaggio cortese al cliente |
| `42 vinto` / `42 perso` | chiude la richiesta dopo l'esito |
| `lista` | elenca le richieste aperte |

Puoi anche scrivere in linguaggio naturale ("per il matrimonio di Giulia direi
900 euro"): un parser AI interpreta il messaggio e, in caso di dubbio, ti chiede
di usare i comandi.

## Provalo subito senza WhatsApp (simulatore)

Serve solo Node.js ≥ 22 e una chiave API Anthropic ([console](https://platform.claude.com/)).

```bash
npm install
cp .env.example .env        # inserisci ANTHROPIC_API_KEY
npm run simulate
```

Nel simulatore scrivi come cliente; `/owner` ti trasforma nel titolare,
`/customer` di nuovo in cliente, `/state` mostra il database, `/reset` azzera.
Lo scenario passo-passo completo è in [`test/e2e-scenario.md`](test/e2e-scenario.md).

Test automatici (senza chiave API): `npm test` — firma webhook, state machine,
comandi titolare, flusso di approvazione, endpoint webhook.

## Messa in produzione

### 1. Prerequisiti Meta (una tantum, ~1 ora)

Serve un numero di telefono **dedicato** al business (non puoi usare il numero
già registrato sull'app WhatsApp/WhatsApp Business del telefono).

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
`PHONE_NUMBER_ID`, `VERIFY_TOKEN`, `APP_SECRET`, `ANTHROPIC_API_KEY`,
`OWNER_PHONE` (il tuo numero, es. `393401234567`), `DB_PATH=/app/data/synthonia.db`.

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
├── config.ts                # validazione .env + profilo aziendale
├── server/                  # Express: verifica webhook + firma HMAC
├── core/
│   ├── router.ts            # smista i messaggi (titolare vs cliente), coda per numero
│   ├── customer-conversation.ts  # turno AI: estrazione dati + risposta
│   ├── owner-flow.ts        # notifica, comandi, approvazione, invio preventivo
│   ├── state-machine.ts     # collecting_info → pending_owner → quoted → won/lost
│   └── templates.ts         # tutti i messaggi in italiano
├── ai/                      # client Claude, system prompt, tool, parser comandi
├── db/                      # SQLite: richieste, messaggi, migrazioni
├── whatsapp/                # Meta Cloud API: invio, firma, parsing payload
└── simulator/               # REPL per provare tutto senza WhatsApp
config/business.json         # servizi, FAQ, zona, tono: personalizzalo!
```

## Personalizzazione

- **Profilo aziendale**: modifica `config/business.json` (servizi, FAQ, zona coperta, tono). Il bot risponde solo in base a questo file.
- **Testi dei messaggi**: tutti in `src/core/templates.ts` (preventivo, rifiuto, notifiche).
- **Modello AI**: `ANTHROPIC_MODEL` in `.env` (default `claude-opus-4-8`).

## Roadmap (non incluso in questa versione)

- Messaggi vocali e immagini dei clienti
- Template message per ricontattare oltre le 24 ore
- Promemoria automatici per richieste senza risposta
- Dashboard web di riepilogo
