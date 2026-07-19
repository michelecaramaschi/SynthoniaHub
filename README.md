# SynthoniaHub

Git for Synthonia

## Creazione post marketing automatica

Questo repository include un generatore automatico di post marketing per
**Synthonia Agency** — l'agenzia di eventi e intrattenimento di
[Michele Caramaschi](https://www.michelecaramaschi.it) (sito
synthoniaagency.com in arrivo) — basato sull'API Claude. Genera post
pronti per Instagram, Facebook, X e LinkedIn, con rotazione automatica di
piattaforme e argomenti, e li salva in `posts/`.

### Uso manuale

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY="la-tua-chiave"

# Piattaforma e argomento scelti automaticamente (rotazione giornaliera)
python -m marketing_bot

# Con controllo completo
python -m marketing_bot --platform instagram --lang it \
  --topic "Nuova patch analogica sul marketplace"

# Solo anteprima, senza salvare
python -m marketing_bot --no-save
```

### Automazione (GitHub Actions)

Il workflow `.github/workflows/marketing-post.yml` genera un post ogni
**lunedì e giovedì alle 09:00 UTC** e lo committa in `posts/`. Può anche
essere lanciato manualmente dalla tab *Actions* (workflow_dispatch), con
piattaforma, argomento e lingua opzionali.

Per attivarlo serve un secret di repository:

1. Vai su **Settings → Secrets and variables → Actions**
2. Crea il secret `ANTHROPIC_API_KEY` con la tua chiave API Anthropic

### Configurazione

Tutto il profilo del brand è in [`config/brand.yaml`](config/brand.yaml):
tono di voce, pubblico, valori, vincoli per piattaforma (lunghezza,
hashtag, stile), lista degli argomenti in rotazione e lingua predefinita.
Si modifica lì, senza toccare il codice.

### Struttura

| Percorso | Contenuto |
|---|---|
| `marketing_bot/` | Generatore Python (API Claude, output strutturato) |
| `config/brand.yaml` | Profilo del brand e impostazioni |
| `posts/` | Post generati (Markdown con front matter) |
| `.github/workflows/marketing-post.yml` | Automazione schedulata |
