# Setup WhatsApp Cloud API su Meta — guida dettagliata

Al termine avrai i **4 valori** da mettere nel file `.env` del progetto:

| Valore `.env` | Cos'è |
|---|---|
| `WHATSAPP_TOKEN` | token permanente per inviare messaggi |
| `PHONE_NUMBER_ID` | ID interno del numero business (⚠️ **non** il numero di telefono) |
| `APP_SECRET` | segreto dell'app, per verificare i messaggi in arrivo |
| `VERIFY_TOKEN` | una stringa segreta che scegli tu |

> Metti in conto ~30-60 minuti la prima volta. La UI di Meta cambia spesso: se un
> menù ha un nome leggermente diverso, cerca la parola chiave indicata.

---

## Prerequisiti

- Un **account Facebook** personale (serve solo per accedere; non pubblichi nulla).
- Il numero **+39 351 796 5812**. ⚠️ **Importante**: se questo numero è
  attualmente attivo sull'**app WhatsApp** o **WhatsApp Business** di un telefono,
  va prima **rimosso da lì** (un numero non può stare sull'app e sulla Cloud API
  insieme). In alternativa, per i primi test usa il **numero di prova** che Meta
  ti regala (vedi Passo 7).

---

## Passo 1 — Crea il portafoglio business (Meta Business)

1. Vai su **[business.facebook.com](https://business.facebook.com/)** e accedi con Facebook.
2. Se non ne hai già uno, crea un **portafoglio business** (Business Portfolio):
   inserisci nome azienda (**Synthonia**), il tuo nome e una email.

## Passo 2 — Crea l'app per sviluppatori

1. Vai su **[developers.facebook.com](https://developers.facebook.com/)** → accedi.
2. In alto: **My Apps** (Le mie app) → **Create App** (Crea un'app).
3. Alla domanda sul caso d'uso, scegli un'opzione che permette di aggiungere
   WhatsApp (di solito **"Other"** → poi tipo **"Business"**).
4. Dai un nome all'app (es. `Synthonia Preventivi`) e collegala al **portafoglio
   business** creato al Passo 1.
5. Crea l'app.

## Passo 3 — Aggiungi il prodotto WhatsApp

1. Nella dashboard dell'app, cerca **WhatsApp** tra i prodotti → **Set up** (Configura).
2. Meta crea automaticamente:
   - un **account WhatsApp Business** (WABA),
   - un **numero di prova** già pronto per i test.
3. Ti ritrovi sulla pagina **WhatsApp → API Setup** (Configurazione API).

## Passo 4 — Prendi il Phone number ID → `PHONE_NUMBER_ID`

Nella pagina **API Setup**, sotto la sezione del numero mittente ("From"),
trovi **Phone number ID**: una lunga sequenza di cifre.

➡️ Copiala: è il tuo `PHONE_NUMBER_ID`.

> ⚠️ NON è il numero di telefono (+39...). È un codice interno di Meta.
> Prendi nota anche del **WhatsApp Business Account ID**, può servire.

## Passo 5 — Token permanente → `WHATSAPP_TOKEN`

Nella pagina API Setup c'è un **token temporaneo** che scade in 24 ore: va bene
solo per una prova al volo. Per l'uso vero serve un **token permanente**, creato
con un "utente di sistema".

1. Vai su **Business Settings** (Impostazioni del business) →
   [business.facebook.com/settings](https://business.facebook.com/settings).
2. Menù a sinistra: **Users** (Utenti) → **System Users** (Utenti di sistema) → **Add** (Aggiungi).
3. Crea un utente di sistema: nome es. `synthonia-bot`, ruolo **Admin**.
4. Seleziona l'utente appena creato → **Assign assets** (Assegna asset) → scegli
   l'**app** creata al Passo 2 e dagli **controllo completo** (Full control).
   Assegna anche l'**account WhatsApp** (WABA) allo stesso modo.
5. Sempre sull'utente di sistema: **Generate new token** (Genera nuovo token).
   - App: seleziona la tua app.
   - Scadenza: **Never** (Mai), se disponibile.
   - Permessi: spunta **`whatsapp_business_messaging`** e
     **`whatsapp_business_management`**.
   - **Generate token**.
6. **Copia subito il token e conservalo**: viene mostrato **una sola volta**.

➡️ Questo è il tuo `WHATSAPP_TOKEN`.

## Passo 6 — App Secret → `APP_SECRET`

1. Nella dashboard dell'app (developers.facebook.com): menù a sinistra →
   **App settings** (Impostazioni) → **Basic** (Di base).
2. Alla voce **App Secret** clicca **Show** (Mostra), inserisci la password FB.

➡️ Copia il valore: è il tuo `APP_SECRET`.

## Passo 7 — Il numero: prova o reale

### Opzione veloce: numero di prova (consigliata per iniziare)

Il numero di prova creato al Passo 3 funziona subito, ma può scrivere **solo a
numeri pre-verificati** (max 5). Nella pagina **API Setup**, sezione **To**
(Destinatario), aggiungi il tuo numero personale e quello di un amico per fare i
test. Usa il **Phone number ID del numero di prova** come `PHONE_NUMBER_ID`.

### Opzione definitiva: il tuo numero +39 351 796 5812

1. Assicurati che il numero **non sia più attivo** su nessuna app WhatsApp del
   telefono (se lo è, apri l'app e rimuovilo / eliminane l'account).
2. In **API Setup** → **Add phone number** (Aggiungi numero) → inserisci
   +39 351 796 5812, scegli il **nome visualizzato** (es. `Synthonia`) e la
   categoria.
3. Verifica il numero col **codice OTP** (SMS o chiamata).
4. Imposta un **PIN a 6 cifre** (verifica in due passaggi) — annotalo.
5. Ora questo numero ha il **suo** `PHONE_NUMBER_ID`: usa quello.

> Per usare un numero reale senza limiti Meta può richiedere la **verifica
> dell'azienda** (Business Verification) e una revisione del nome visualizzato.
> Puoi comunque iniziare i test col numero di prova mentre la verifica è in corso.

## Passo 8 — Verify token → `VERIFY_TOKEN`

Questo **lo inventi tu**: una parola/stringa segreta a piacere (es.
`synthonia-webhook-2026`). Non si prende da nessuna parte: la scrivi nel `.env` e
la stessa identica la reinserirai quando colleghi il webhook.

---

## Riepilogo: il tuo `.env`

```
WHATSAPP_TOKEN=<token permanente del Passo 5>
PHONE_NUMBER_ID=<Phone number ID del Passo 4 o 7>
VERIFY_TOKEN=<la stringa che hai scelto al Passo 8>
APP_SECRET=<App Secret del Passo 6>
OWNER_PHONE=39XXXXXXXXXX   # il TUO numero personale, senza '+'
PORT=3000
# ANTHROPIC_API_KEY=       # opzionale (vuoto = flusso guidato gratuito)
```

## Passo 9 — Collega il webhook

Questo passo richiede che il server sia raggiungibile via HTTPS. Come farlo:

- **Test in locale**: vedi [`docs/test-locale-cloudflare.md`](test-locale-cloudflare.md)
  o [`docs/test-locale-ngrok.md`](test-locale-ngrok.md).
- **In produzione**: vedi README → *Messa in produzione*.

In sintesi, in **WhatsApp → Configuration → Webhook** (Configurazione):
- **Callback URL**: `https://<tuo-indirizzo>/webhook`
- **Verify token**: lo stesso `VERIFY_TOKEN` del `.env`
- **Verify and save**, poi sottoscrivi il campo **messages**.

---

## Problemi comuni

| Sintomo | Causa / soluzione |
|---|---|
| Non riesco ad aggiungere il numero reale | È ancora attivo su un'app WhatsApp: rimuovilo da lì prima |
| Il token smette di funzionare dopo un giorno | Hai usato il token temporaneo: rifai il Passo 5 (token permanente) |
| Il bot scrive solo ad alcuni numeri | Stai usando il numero di prova: aggiungi i destinatari, oppure passa al numero reale |
| "Verify and save" fallisce | Server non avviato, `VERIFY_TOKEN` diverso, o manca `/webhook` nell'URL |
| Log del server: `401` | `APP_SECRET` sbagliato: ricopialo dal Passo 6 |
