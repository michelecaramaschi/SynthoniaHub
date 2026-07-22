import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { BusinessProfile } from "../config.js";
import type { QuoteRequest } from "../db/repositories.js";
import {
  eventDateItalian,
  eventTypeLabel,
  formatPrice,
  serviceLabels,
} from "../core/templates.js";

// Synthonia brand palette: dark, elegant, high-contrast — mirrors the real
// "Artistic Proposal" decks (photo overlays, white type on near-black).
const BG = "#0f1420"; // page background (deep navy-black)
const PANEL = "#171d2b"; // slightly lighter panel/rule fills
const WHITE = "#ffffff";
const GREY = "#8a94a6"; // muted secondary text (the "DJ SET" grey in bicolour titles)
const HAIRLINE = "#2a3242";
const ACCENT = "#c9a24b"; // warm gold, from the venue lights in the decks

/** Public URL the customer opens to accept the quote. */
export function confirmationUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/conferma/${token}`;
}

/** Public URL that streams the quote PDF, for the owner to download and forward. */
export function pdfUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/preventivo/${token}`;
}

/** Quote validity window, mirroring the 30 days stated in the WhatsApp message. */
function validUntil(from: Date): Date {
  const until = new Date(from);
  until.setDate(until.getDate() + 30);
  return until;
}

function formatItalianDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Renders letter-spaced uppercase, the signature look of the Synthonia decks. */
function spaced(text: string): string {
  return text.toUpperCase();
}

export interface QuotePdfOptions {
  request: QuoteRequest;
  business: BusinessProfile;
  confirmUrl: string;
  /** Injected so tests produce a stable document. */
  now?: Date;
}

/**
 * Renders the quote as a PDF buffer in the Synthonia brand style: dark theme,
 * SY monogram, spaced uppercase titles. Carries a confirmation link and a QR
 * code for the same URL, so the customer can accept from phone or desktop.
 */
export async function generateQuotePdf(
  options: QuotePdfOptions,
): Promise<Buffer> {
  const { request, business, confirmUrl } = options;
  const now = options.now ?? new Date();

  if (request.price_eur == null) {
    throw new Error(`Quote request #${request.id} has no price set`);
  }

  // Gold QR on transparent, so it sits cleanly on the dark confirmation panel.
  const qrDataUrl = await QRCode.toDataURL(confirmUrl, {
    margin: 1,
    width: 320,
    color: { dark: "#ffffff", light: "#00000000" },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1]!, "base64");

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const M = 48; // content margin
  const left = M;
  const right = pageW - M;
  const width = right - left;

  // ── Full-bleed dark background ──────────────────────────────────────────────
  doc.rect(0, 0, pageW, pageH).fill(BG);

  // ── Brand header: "Synthonia Agency" left, SY monogram right ────────────────
  doc
    .fillColor(WHITE)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Synthonia Agency", left, M, { characterSpacing: 0.5 });
  drawMonogram(doc, right - 34, M - 2);

  let y = M + 40;

  // ── Title: bicolour spaced uppercase ("PREVENTIVO" white + "SU MISURA" grey) ─
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(WHITE)
    .text(spaced("Preventivo "), left, y, {
      characterSpacing: 3,
      continued: true,
    })
    .fillColor(GREY)
    .text(spaced("su misura"), { characterSpacing: 3 });
  y = doc.y + 6;

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(GREY)
    .text(
      `#${request.id}  ·  emesso il ${formatItalianDate(now)}  ·  valido fino al ${formatItalianDate(validUntil(now))}`,
      left,
      y,
      { characterSpacing: 0.5 },
    );
  y = doc.y + 22;

  // ── INFO block (client + event) in the deck's centred style ─────────────────
  y = sectionTitle(doc, "Info evento", left, width, y);
  y = infoRow(doc, "Cliente", request.customer_name ?? "non fornito", left, width, y);
  y = infoRow(doc, "Contatto", `+${request.customer_phone}`, left, width, y);
  y = infoRow(doc, "Evento", eventTypeLabel(request.event_type), left, width, y);
  y = infoRow(doc, "Data", eventDateItalian(request), left, width, y);
  y = infoRow(doc, "Location", request.location ?? "da definire", left, width, y);
  y = infoRow(
    doc,
    "Ospiti",
    request.guest_count != null ? String(request.guest_count) : "da definire",
    left,
    width,
    y,
  );
  y = infoRow(
    doc,
    "Durata",
    request.duration_hours != null ? `${request.duration_hours} ore` : "da definire",
    left,
    width,
    y,
  );
  if (request.special_requests) {
    y = infoRow(doc, "Richieste", request.special_requests, left, width, y);
  }
  y += 14;

  // ── Servizi inclusi ─────────────────────────────────────────────────────────
  y = sectionTitle(doc, "Servizi inclusi", left, width, y);
  const services = serviceLabels(request.services, business);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(WHITE)
    .text(services, left, y, { width, characterSpacing: 0.3 });
  y = doc.y + 6;
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GREY)
    .text(
      "Include attrezzatura, allestimento, smontaggio e assistenza tecnica per tutta la durata dell'evento.",
      left,
      y,
      { width },
    );
  y = doc.y + 6;

  // ── Note del titolare ───────────────────────────────────────────────────────
  if (request.owner_notes) {
    y += 8;
    y = sectionTitle(doc, "Note", left, width, y);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#cfd6e2")
      .text(request.owner_notes, left, y, { width });
    y = doc.y + 6;
  }
  y += 14;

  // ── Totale: gold rule + large figure ────────────────────────────────────────
  doc
    .strokeColor(ACCENT)
    .lineWidth(1)
    .moveTo(left, y)
    .lineTo(right, y)
    .stroke();
  y += 14;
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(WHITE)
    .text(spaced("Totale"), left, y + 6, { characterSpacing: 2 });
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(ACCENT)
    .text(`${formatPrice(request.price_eur)} €`, left, y, {
      width,
      align: "right",
    });
  y = doc.y + 4;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text("IVA inclusa · validità 30 giorni dalla data di emissione", left, y, {
      width,
      align: "right",
    });
  y += 26;

  // ── Confirmation panel (gold border, QR + link) ─────────────────────────────
  const boxH = 128;
  doc.roundedRect(left, y, width, boxH, 8).fill(PANEL);
  doc
    .roundedRect(left, y, width, boxH, 8)
    .lineWidth(1)
    .strokeColor(ACCENT)
    .stroke();

  const qrSize = 92;
  const qrPad = 18;
  const qrX = right - qrSize - qrPad;
  const qrY = y + (boxH - qrSize) / 2;
  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

  const tx = left + 22;
  const tw = qrX - tx - 22;
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(ACCENT)
    .text(spaced("Conferma il preventivo"), tx, y + 22, {
      width: tw,
      characterSpacing: 1.5,
    });
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#cfd6e2")
    .text(
      "Inquadra il QR code o apri il link qui sotto: la conferma ci arriva subito, senza altri passaggi.",
      tx,
      doc.y + 8,
      { width: tw },
    );
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(ACCENT)
    .text(confirmUrl, tx, doc.y + 12, {
      width: tw,
      link: confirmUrl,
      underline: true,
    });
  y += boxH + 20;

  // ── Footer: contacts, centred, like the closing deck page ───────────────────
  doc
    .strokeColor(HAIRLINE)
    .lineWidth(1)
    .moveTo(left, y)
    .lineTo(right, y)
    .stroke();
  y += 12;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(WHITE)
    .text(spaced(business.name), left, y, { width, align: "center", characterSpacing: 2 });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text(
      `${business.coverage_area}  ·  Documento generato automaticamente, non richiede firma.`,
      left,
      doc.y + 3,
      { width, align: "center" },
    );

  doc.end();
  return done;
}

/** Draws the SY monogram as vector text (no external asset needed). */
function drawMonogram(doc: PDFKit.PDFDocument, x: number, y: number): void {
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(WHITE)
    .text("SY", x, y, { lineBreak: false });
  // The dot in the real logo sits at the baseline right of the Y.
  doc.circle(x + 30, y + 20, 1.6).fill(ACCENT);
}

/** Section header: spaced uppercase label over a hairline rule. Returns new y. */
function sectionTitle(
  doc: PDFKit.PDFDocument,
  label: string,
  left: number,
  width: number,
  y: number,
): number {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(ACCENT)
    .text(spaced(label), left, y, { width, characterSpacing: 2 });
  const ny = doc.y + 5;
  doc
    .strokeColor(HAIRLINE)
    .lineWidth(1)
    .moveTo(left, ny)
    .lineTo(left + width, ny)
    .stroke();
  return ny + 10;
}

/** Label/value row on the dark theme. Returns the new y after the row. */
function infoRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  left: number,
  width: number,
  y: number,
): number {
  const labelWidth = 96;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GREY)
    .text(label, left, y, { width: labelWidth });
  const labelBottom = doc.y;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(WHITE)
    .text(value, left + labelWidth, y, { width: width - labelWidth });
  return Math.max(labelBottom, doc.y) + 5;
}
