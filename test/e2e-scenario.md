# Scenario demo end-to-end (~2 minuti)

Prerequisito: solo Node.js ≥ 22. La chiave API è **facoltativa**:

- **senza** `ANTHROPIC_API_KEY` → flusso guidato (il bot fa domande in sequenza)
- **con** `ANTHROPIC_API_KEY` → conversazione AI in linguaggio naturale

```
npm install
npm run simulate
```

All'avvio il simulatore stampa quale modalità è attiva.

## 1. Il cliente chiede un preventivo

Scrivi (come cliente) i messaggi seguenti, uno alla volta.

```
Ciao! Mi sposo l'anno prossimo e cercavo un dj per il ricevimento
```

Il bot si presenta e chiede il tipo di evento (in modalità guidata) o qualche
dettaglio (in modalità AI).

```
è un matrimonio
sabato 12 settembre 2026
Villa Le Rose, Bergamo
saremo circa 120 invitati
dj set, impianto audio e luci
dalle 19 all'1
Maria Rossi
no grazie
```

In modalità AI puoi anche scrivere tutto insieme in un unico messaggio libero.

Quando tutte le informazioni sono raccolte, il bot ringrazia con un riepilogo e
compare il riquadro `to OWNER` con la richiesta strutturata:

```
🎧 NUOVA RICHIESTA DI PREVENTIVO #1
👤 Cliente: Maria Rossi ...
...
Per inviare il preventivo rispondi:
  1 prezzo 900
```

## 2. Prova che il bot non fa prezzi

```
Più o meno quanto costa?
```

Il bot NON deve dare cifre: spiega che il titolare risponderà con un
preventivo su misura.

## 3. Il titolare prepara e approva il preventivo

```
/owner
1 prezzo 1200
```

Compare l'anteprima esatta del messaggio che riceverà il cliente.

```
1 nota Include tecnico del suono per tutta la serata
1 ok
```

Il riquadro `to CUSTOMER` mostra il preventivo formattato inviato al cliente
(1.200 €, nota inclusa) e il titolare riceve la conferma.

```
1 vinto
```

## 4. Verifica lo stato

```
/state
```

La richiesta #1 deve avere `"status": "won"`, prezzo 1200 e tutti i campi
compilati.

Per ripartire da zero: `/reset`. Per uscire: `/exit`.
