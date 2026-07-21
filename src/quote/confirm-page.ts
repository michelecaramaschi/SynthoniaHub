import type { BusinessProfile } from "../config.js";
import type { QuoteRequest } from "../db/repositories.js";
import {
  eventDateItalian,
  eventTypeLabel,
  formatPrice,
  serviceLabels,
} from "../core/templates.js";

/** Customer-supplied values land in HTML, so every interpolation goes through this. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLES = `
  *{ box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f4f6f8; color: #222; line-height: 1.55;
    padding: 24px 16px; display: flex; justify-content: center;
  }
  .card {
    background: #fff; max-width: 560px; width: 100%;
    border-radius: 12px; padding: 32px; box-shadow: 0 2px 16px rgba(0,0,0,.08);
  }
  h1 { color: #1a3a52; font-size: 22px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 14px; margin-bottom: 24px; }
  dl { border-top: 1px solid #e4e9ee; margin-bottom: 20px; }
  .row {
    display: flex; justify-content: space-between; gap: 16px;
    padding: 10px 0; border-bottom: 1px solid #e4e9ee; font-size: 15px;
  }
  dt { color: #666; flex-shrink: 0; }
  dd { text-align: right; font-weight: 500; }
  .total {
    background: #f2f5f8; border-radius: 8px; padding: 16px;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px;
  }
  .total span:first-child { color: #1a3a52; font-weight: 700; }
  .total span:last-child { color: #1a3a52; font-weight: 700; font-size: 22px; }
  label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #1a3a52; }
  input, textarea {
    width: 100%; padding: 11px 12px; font: inherit; font-size: 15px;
    border: 1px solid #ccd4dc; border-radius: 8px; margin-bottom: 16px;
  }
  input:focus, textarea:focus { outline: 2px solid #1f7a4d; border-color: transparent; }
  button {
    width: 100%; padding: 15px; font: inherit; font-size: 16px; font-weight: 700;
    color: #fff; background: #1f7a4d; border: 0; border-radius: 8px; cursor: pointer;
  }
  button:hover { background: #1a6741; }
  button:disabled { background: #9bb3a6; cursor: not-allowed; }
  .note { font-size: 13px; color: #666; margin-top: 14px; text-align: center; }
  .banner { border-radius: 8px; padding: 20px; text-align: center; }
  .banner.ok { background: #e8f5ee; border: 1px solid #1f7a4d; }
  .banner.ok h1 { color: #1f7a4d; }
  .banner.warn { background: #fdf3e3; border: 1px solid #b7791f; }
  .banner.warn h1 { color: #b7791f; }
  .footer { margin-top: 24px; text-align: center; color: #999; font-size: 12px; }
`;

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body><div class="card">${body}</div></body>
</html>`;
}

function detailRows(
  request: QuoteRequest,
  business: BusinessProfile,
): string {
  const rows: Array<[string, string]> = [
    ["Evento", eventTypeLabel(request.event_type)],
    ["Data", eventDateItalian(request)],
    ["Luogo", request.location ?? "da definire"],
    ["Servizi", serviceLabels(request.services, business)],
  ];
  if (request.guest_count != null) {
    rows.push(["Ospiti", String(request.guest_count)]);
  }
  if (request.duration_hours != null) {
    rows.push(["Durata", `${request.duration_hours} ore`]);
  }
  return rows
    .map(
      ([label, value]) =>
        `<div class="row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");
}

/** The acceptance form the confirmation link opens. */
export function confirmFormPage(
  request: QuoteRequest,
  business: BusinessProfile,
  token: string,
): string {
  const price =
    request.price_eur != null ? `${formatPrice(request.price_eur)} €` : "—";
  return page(
    `Conferma preventivo #${request.id} — ${business.name}`,
    `
    <h1>Preventivo #${escapeHtml(String(request.id))}</h1>
    <p class="sub">${escapeHtml(business.name)} — Musica ed eventi</p>
    <dl>${detailRows(request, business)}</dl>
    <div class="total"><span>Totale</span><span>${escapeHtml(price)}</span></div>
    <form method="POST" action="/conferma/${encodeURIComponent(token)}">
      <label for="name">Nome di chi conferma</label>
      <input id="name" name="name" type="text" maxlength="120"
             value="${escapeHtml(request.customer_name ?? "")}" required>
      <label for="notes">Note (facoltative)</label>
      <textarea id="notes" name="notes" rows="3" maxlength="1000"
                placeholder="Eventuali richieste o precisazioni"></textarea>
      <button type="submit">Confermo e accetto il preventivo</button>
    </form>
    <p class="note">Cliccando confermi l'accettazione del preventivo. Riceverai conferma su WhatsApp.</p>
    <p class="footer">${escapeHtml(business.name)} — ${escapeHtml(business.coverage_area)}</p>
    `,
  );
}

export function confirmedPage(
  request: QuoteRequest,
  business: BusinessProfile,
  alreadyConfirmed = false,
): string {
  const heading = alreadyConfirmed
    ? "Preventivo già confermato"
    : "Preventivo confermato";
  const message = alreadyConfirmed
    ? "Questo preventivo risulta già accettato. Non serve fare altro."
    : "Grazie! Abbiamo registrato la tua conferma e ti ricontattiamo al più presto su WhatsApp.";
  return page(
    `${heading} — ${business.name}`,
    `
    <div class="banner ok">
      <h1>✅ ${escapeHtml(heading)}</h1>
      <p class="sub" style="margin:8px 0 0">${escapeHtml(message)}</p>
    </div>
    <p class="footer">Preventivo #${escapeHtml(String(request.id))} — ${escapeHtml(business.name)}</p>
    `,
  );
}

/** Shown for unknown tokens and for requests no longer open (declined, still pending). */
export function unavailablePage(
  business: BusinessProfile,
  message: string,
): string {
  return page(
    `Link non valido — ${business.name}`,
    `
    <div class="banner warn">
      <h1>Link non disponibile</h1>
      <p class="sub" style="margin:8px 0 0">${escapeHtml(message)}</p>
    </div>
    <p class="footer">${escapeHtml(business.name)} — scrivici su WhatsApp per assistenza.</p>
    `,
  );
}
