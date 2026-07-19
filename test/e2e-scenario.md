# Scenario demo end-to-end (~2 minuti)

Prerequisito: `ANTHROPIC_API_KEY` nel file `.env` (o profilo `ant auth login`).
Non servono credenziali WhatsApp.

```
npm install
npm run simulate
```

## 1. Il cliente chiede un preventivo

Scrivi (come cliente) i messaggi seguenti, uno alla volta. Le risposte esatte
del bot variano, ma deve sempre: salutare, fare al massimo 1-2 domande alla
volta, non fare mai prezzi.

```
Ciao! Mi sposo l'anno prossimo e cercavo un dj per il ricevimento
```

Il bot si presenta e chiede qualche dettaglio (data, luogo, ...).

```
Il matrimonio è sabato 12 settembre 2026 a Villa Le Rose a Bergamo, saremo circa 120 invitati
```

```
Ci servirebbe il dj set con impianto audio e anche le luci per la pista. Direi dalle 19 all'1, quindi 6 ore. Ah, sono Maria!
```

Quando tutte le informazioni sono raccolte, il bot ringrazia e compare il
riquadro `to OWNER` con il riepilogo strutturato:

```
🎧 NUOVA RICHIESTA DI PREVENTIVO #1
👤 Cliente: Maria ...
...
Per inviare il preventivo rispondi:
  1 prezzo 900
```

Se il bot fa ancora domande, rispondi: mancava qualche campo.

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

Comando in linguaggio naturale (usa l'AI di fallback):

```
segna come vinto il matrimonio di Maria
```

## 4. Verifica lo stato

```
/state
```

La richiesta #1 deve avere `"status": "won"`, prezzo 1200 e tutti i campi
compilati.

Per ripartire da zero: `/reset`. Per uscire: `/exit`.
