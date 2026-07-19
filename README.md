# SynthoniaHub
Git for Synthonia

## Sito Synthonia

Sito statico (HTML/CSS/JS puro, nessuna dipendenza o build tool) per Synthonia — eventi, spettacoli e intrattenimento.

### Funzionalità

- **Preventivo via WhatsApp**: il form nella sezione "Preventivo" genera un messaggio precompilato e apre una chat WhatsApp (`wa.me`) verso il numero dell'attività — nessun backend richiesto.
- **Location ed eventi**: `locations.html` elenca le location partner, `location.html?slug=...` mostra il dettaglio (eventi passati/futuri e galleria fotografica) di ciascuna.

### Come aggiungere/aggiornare location ed eventi

Tutti i contenuti di location, eventi e foto vivono in un unico file: **`js/locations-data.js`**. Per aggiungere o modificare una location, aggiungi/modifica una voce nell'array `LOCATIONS` (nome, città, descrizione, eventi, foto) — non serve toccare l'HTML.

Le foto sono attualmente placeholder generati via CSS. Per usare foto reali, aggiungi le immagini in `assets/img/` e imposta il campo `src` in ogni oggetto `photos` (e aggiorna `js/locations-render.js` per usare `<img src="...">` al posto del riquadro sfumato).

### Numero WhatsApp

Configurato in `js/main.js` (`WHATSAPP_NUMBER`). Formato richiesto: solo cifre, con prefisso internazionale, senza `+` (es. `393923250072`).

### Sviluppo locale

Nessun build necessario. Basta aprire `index.html` nel browser, oppure servire la cartella con un server statico, ad esempio:

```bash
python3 -m http.server 8000
```

e visitare `http://localhost:8000`.
