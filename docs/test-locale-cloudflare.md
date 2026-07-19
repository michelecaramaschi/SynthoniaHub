# Test in locale con WhatsApp vero (Cloudflare Tunnel)

Come la guida ngrok, ma con **Cloudflare Tunnel**. Vantaggio: per un test veloce
(«quick tunnel») **non serve alcun account** — né Cloudflare né altro.

> ⚠️ Solo per test. L'URL del quick tunnel è temporaneo e **cambia a ogni
> riavvio**: dovrai riaggiornare il webhook su Meta ogni volta. Per l'uso
> quotidiano dell'azienda serve un hosting sempre acceso (README → *Messa in
> produzione*).

## Prerequisito importante

Questo test collega il **server vero** (non il simulatore) a WhatsApp, quindi ti
servono già i valori di Meta nel `.env`: `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`,
`VERIFY_TOKEN`, `APP_SECRET`, `OWNER_PHONE`. Senza questi 4 valori Meta il server
**non parte**. Se non hai ancora l'account Meta, crealo prima (README → *Messa in
produzione → Prerequisiti Meta*).

## 1. Configura il `.env`

```bash
cp .env.example .env
```

Compila con i valori dalla dashboard Meta:

```
WHATSAPP_TOKEN=...
PHONE_NUMBER_ID=...       # il Phone number ID, NON il numero di telefono
VERIFY_TOKEN=un-segreto-a-tua-scelta
APP_SECRET=...
OWNER_PHONE=39XXXXXXXXXX  # il TUO numero personale, senza '+'
PORT=3000
# ANTHROPIC_API_KEY=      # opzionale: vuoto = flusso guidato gratuito
```

## 2. Avvia il server (primo terminale)

```bash
npm install
npm start
```

Deve stampare `SynthoniaHub in ascolto sulla porta 3000`. **Lascialo aperto.**

## 3. Installa cloudflared

- **Windows**: `winget install --id Cloudflare.cloudflared`
  (oppure scarica `cloudflared.exe` dalle [release ufficiali](https://github.com/cloudflare/cloudflared/releases/latest))
- **Mac**: `brew install cloudflared`
- **Linux**: vedi le [istruzioni ufficiali](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

## 4. Avvia il tunnel (secondo terminale)

```bash
cloudflared tunnel --url http://localhost:3000
```

Dopo qualche secondo cloudflared stampa un URL come:

```
https://random-parole-qui.trycloudflare.com
```

Copialo. **Lascia aperto anche questo terminale.** (Nessun login richiesto: è un
«quick tunnel» anonimo.)

## 5. Collega il webhook su Meta

Dashboard Meta → **WhatsApp → Configuration → Webhook** → *Edit*:

- **Callback URL**: `https://random-parole-qui.trycloudflare.com/webhook`
  ← il tuo URL Cloudflare + `/webhook`
- **Verify token**: lo stesso identico valore di `VERIFY_TOKEN` nel `.env`
- Clicca **Verify and save** (il server, già avviato al passo 2, risponde da solo)
- Sottoscrivi il campo **messages** (*Manage* → spunta `messages`)

## 6. Prova che funziona

1. Dal **tuo** numero (`OWNER_PHONE`) scrivi `lista` al numero business
   → devi ricevere *"Nessuna richiesta aperta al momento. ✅"*
2. Da **un altro** numero scrivi un messaggio al numero business
   → il bot risponde e inizia a raccogliere i dati del preventivo

> Con il **numero di prova** di Meta puoi scrivere solo verso i numeri
> pre-verificati nella dashboard.

## Ogni volta che riavvii il tunnel

L'URL `trycloudflare.com` **cambia**. Devi:
1. copiare il nuovo URL,
2. rimetterlo come Callback URL nel webhook Meta e ricliccare *Verify and save*.

Per un URL fisso serve un account Cloudflare + un tuo dominio (tunnel «con nome»):
utile solo se lo usi spesso; per un test occasionale il quick tunnel basta.

## Problemi comuni

| Sintomo | Causa / soluzione |
|---|---|
| *Verify and save* fallisce | Il server non è avviato, `VERIFY_TOKEN` non coincide, o manca `/webhook` nell'URL |
| Il bot non risponde | Non hai sottoscritto **messages**, oppure hai riavviato il tunnel e l'URL è cambiato |
| Nei log compare `401` | `APP_SECRET` sbagliato: ricopialo da *App Settings → Basic* |
| Il server non parte | Manca una delle 4 variabili Meta nel `.env` (l'errore ti dice quale) |
| `cloudflared` non trovato | Installazione non riuscita o terminale da riaprire dopo l'installazione |
