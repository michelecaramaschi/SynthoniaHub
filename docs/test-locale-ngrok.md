# Test in locale con WhatsApp vero (ngrok)

Questa guida ti fa provare il bot **sul tuo numero WhatsApp business reale**,
tenendo il server **sul tuo computer** (niente hosting, niente carta di credito).
Serve per testare prima di mettere tutto su un hosting sempre acceso.

> ⚠️ Solo per test. Con ngrok gratuito, quando spegni il computer o riavvii il
> tunnel il bot va offline e l'URL cambia: dovrai riaggiornare il webhook su
> Meta. Per l'uso quotidiano dell'azienda serve un hosting sempre attivo (vedi
> README → *Messa in produzione*).

## Cosa ti serve

- Node.js ≥ 22
- Il numero business già collegato alla **WhatsApp Cloud API** (dashboard Meta →
  *WhatsApp → API Setup*)
- Un account **gratuito** su [ngrok.com](https://ngrok.com/)

## 1. Configura il `.env`

```bash
cp .env.example .env
```

Compila con i valori presi dalla dashboard Meta (tutti e 4 obbligatori, altrimenti
il server non parte):

```
WHATSAPP_TOKEN=...        # token permanente (System Users)
PHONE_NUMBER_ID=...       # Phone number ID del numero business (NON il numero!)
VERIFY_TOKEN=un-segreto-a-tua-scelta
APP_SECRET=...            # App Settings → Basic
OWNER_PHONE=39XXXXXXXXXX  # il TUO numero personale, senza '+'
PORT=3000
# ANTHROPIC_API_KEY=      # opzionale: lascia vuoto per il flusso guidato gratuito
```

## 2. Avvia il server (primo terminale)

```bash
npm install
npm start
```

Deve stampare: `SynthoniaHub in ascolto sulla porta 3000`. **Lascialo aperto.**

## 3. Avvia ngrok (secondo terminale)

Installa ngrok ([istruzioni](https://ngrok.com/download)), poi una volta sola
imposta il tuo token (lo trovi nella dashboard ngrok):

```bash
ngrok config add-authtoken IL_TUO_AUTHTOKEN
```

Avvia il tunnel verso la porta del server:

```bash
ngrok http 3000
```

ngrok mostra una riga tipo:

```
Forwarding   https://a1b2-93-40-12-34.ngrok-free.app -> http://localhost:3000
```

Copia quell'URL `https://...ngrok-free.app`. **Lascia aperto anche questo terminale.**

## 4. Collega il webhook su Meta

Dashboard Meta → **WhatsApp → Configuration → Webhook** → *Edit*:

- **Callback URL**: `https://a1b2-...ngrok-free.app/webhook`  ← il tuo URL ngrok + `/webhook`
- **Verify token**: lo stesso identico valore di `VERIFY_TOKEN` nel `.env`
- Clicca **Verify and save** (il server risponde da solo alla verifica —
  per questo dev'essere già avviato al passo 2)
- Nella lista dei campi, sottoscrivi **messages** (clicca *Manage* → spunta `messages`)

## 5. Prova che funziona

1. Dal **tuo** numero (`OWNER_PHONE`) scrivi `lista` al numero business
   → devi ricevere *"Nessuna richiesta aperta al momento. ✅"*
2. Da **un altro** numero scrivi un messaggio qualsiasi al numero business
   → il bot risponde e inizia a raccogliere i dati per il preventivo
3. Completa la conversazione → tu (come titolare) ricevi la notifica
   `🎧 NUOVA RICHIESTA DI PREVENTIVO #1` e puoi rispondere con `1 prezzo 900`, `1 ok`…

> Se stai usando il **numero di prova** di Meta (non ancora il tuo numero reale),
> puoi scrivere solo verso i numeri che hai pre-verificato nella dashboard.

## Ogni volta che riavvii ngrok

L'URL `ngrok-free.app` **cambia**. Devi:
1. copiare il nuovo URL,
2. rimetterlo come Callback URL nel webhook Meta e ricliccare *Verify and save*.

(Con un piano ngrok a pagamento o con Cloudflare Tunnel + un tuo dominio l'URL
resta fisso — ma per un test occasionale il piano gratuito va benissimo.)

## Problemi comuni

| Sintomo | Causa / soluzione |
|---|---|
| *Verify and save* fallisce | Il server non è avviato, oppure `VERIFY_TOKEN` non coincide, oppure hai dimenticato `/webhook` nell'URL |
| Il bot non risponde ai messaggi | Non hai sottoscritto il campo **messages**; oppure hai riavviato ngrok e l'URL è cambiato |
| Nei log del server compare `401` | `APP_SECRET` sbagliato: la firma dei messaggi non torna. Ricopialo da *App Settings → Basic* |
| Il server non parte | Manca una delle 4 variabili Meta nel `.env` (il messaggio d'errore ti dice quale) |
