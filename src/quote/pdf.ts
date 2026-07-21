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

const INK = "#1a3a52";
const MUTED = "#666666";
const RULE = "#d8dee4";
const ACCENT = "#1f7a4d";

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

export interface QuotePdfOptions {
  request: QuoteRequest;
  business: BusinessProfile;
  confirmUrl: string;
  /** Injected so tests produce a stable document. */
  now?: Date;
}

/**
 * Renders the quote as a PDF buffer. The document carries a confirmation link
 * and a QR code for the same URL, so the customer can accept from phone or desktop.
 */
export async function generateQuotePdf(
  options: QuotePdfOptions,
): Promise<Buffer> {
  const { request, business, confirmUrl } = options;
  const now = options.now ?? new Date();

  if (request.price_eur == null) {
    throw new Error(`Quote request #${request.id} has no price set`);
  }

  const qrDataUrl = await QRCode.toDataURL(confirmUrl, {
    margin: 1,
    width: 320,
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1]!, "base64");

  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  // ── Header ────────────────────────────────────────────────────────────────
  doc
    .fillColor(INK)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(business.name, left, doc.y);
  doc
    .fillColor(MUTED)
    .fontSize(10)
    .font("Helvetica")
    .text("Musica ed eventi", { continued: false });

  doc.moveDown(0.8);
  doc
    .strokeColor(INK)
    .lineWidth(2)
    .moveTo(left, doc.y)
    .lineTo(right, doc.y)
    .stroke();
  doc.moveDown(1);

  doc
    .fillColor(INK)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(`Preventivo #${request.id}`);
  doc
    .fillColor(MUTED)
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Emesso il ${formatItalianDate(now)} — valido fino al ${formatItalianDate(validUntil(now))}`,
    );
  doc.moveDown(1.2);

  // ── Customer ──────────────────────────────────────────────────────────────
  sectionTitle(doc, "CLIENTE", left, width);
  row(doc, "Nome", request.customer_name ?? "non fornito", left, width);
  row(doc, "Telefono", `+${request.customer_phone}`, left, width);
  doc.moveDown(0.8);

  // ── Event detail ──────────────────────────────────────────────────────────
  sectionTitle(doc, "DETTAGLI EVENTO", left, width);
  row(doc, "Tipo evento", eventTypeLabel(request.event_type), left, width);
  row(doc, "Data", eventDateItalian(request), left, width);
  row(doc, "Luogo", request.location ?? "da definire", left, width);
  row(
    doc,
    "Ospiti",
    request.guest_count != null ? String(request.guest_count) : "da definire",
    left,
    width,
  );
  row(doc, "Servizi", serviceLabels(request.services, business), left, width);
  row(
    doc,
    "Durata",
    request.duration_hours != null
      ? `${request.duration_hours} ore`
      : "da definire",
    left,
    width,
  );
  if (request.special_requests) {
    row(doc, "Richieste", request.special_requests, left, width);
  }
  doc.moveDown(0.8);

  // ── Notes from the owner ──────────────────────────────────────────────────
  if (request.owner_notes) {
    sectionTitle(doc, "NOTE", left, width);
    doc
      .fillColor("#333333")
      .fontSize(10)
      .font("Helvetica")
      .text(request.owner_notes, left, doc.y, { width });
    doc.moveDown(0.8);
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  const totalTop = doc.y;
  doc.rect(left, totalTop, width, 42).fill("#f2f5f8");
  doc
    .fillColor(INK)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("TOTALE", left + 14, totalTop + 14);
  doc
    .fontSize(16)
    .text(`${formatPrice(request.price_eur)} €`, left, totalTop + 11, {
      width: width - 14,
      align: "right",
    });
  doc.y = totalTop + 42;
  doc.moveDown(0.6);

  doc
    .fillColor(MUTED)
    .fontSize(9)
    .font("Helvetica")
    .text(
      "Il preventivo comprende attrezzatura, allestimento e assistenza tecnica per tutta la durata dell'evento. Validità 30 giorni dalla data di emissione.",
      left,
      doc.y,
      { width },
    );
  doc.moveDown(1.2);

  // ── Confirmation block ────────────────────────────────────────────────────
  const boxTop = doc.y;
  const boxHeight = 132;
  doc
    .rect(left, boxTop, width, boxHeight)
    .lineWidth(1.5)
    .strokeColor(ACCENT)
    .stroke();

  const qrSize = 96;
  const qrX = right - qrSize - 18;
  doc.image(qrBuffer, qrX, boxTop + 18, { width: qrSize, height: qrSize });

  const textWidth = qrX - left - 36;
  doc
    .fillColor(ACCENT)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("CONFERMA IL PREVENTIVO", left + 18, boxTop + 20, {
      width: textWidth,
    });
  doc
    .fillColor("#333333")
    .fontSize(10)
    .font("Helvetica")
    .text(
      "Per accettare, inquadra il QR code o apri questo link. La conferma ci arriva subito, senza altri passaggi.",
      left + 18,
      doc.y + 4,
      { width: textWidth },
    );
  doc.moveDown(0.4);
  doc
    .fillColor(ACCENT)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(confirmUrl, left + 18, doc.y, {
      width: textWidth,
      link: confirmUrl,
      underline: true,
    });

  doc.y = boxTop + boxHeight;
  doc.moveDown(1);

  // ── Footer ────────────────────────────────────────────────────────────────
  doc
    .strokeColor(RULE)
    .lineWidth(1)
    .moveTo(left, doc.y)
    .lineTo(right, doc.y)
    .stroke();
  doc.moveDown(0.5);
  doc
    .fillColor(MUTED)
    .fontSize(8)
    .font("Helvetica")
    .text(
      `${business.name} — ${business.coverage_area}. Documento generato automaticamente, non richiede firma.`,
      left,
      doc.y,
      { width, align: "center" },
    );

  doc.end();
  return done;
}

function sectionTitle(
  doc: PDFKit.PDFDocument,
  label: string,
  left: number,
  width: number,
): void {
  doc
    .fillColor(INK)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(label, left, doc.y, { width, characterSpacing: 0.6 });
  doc.moveDown(0.2);
  doc
    .strokeColor(RULE)
    .lineWidth(1)
    .moveTo(left, doc.y)
    .lineTo(left + width, doc.y)
    .stroke();
  doc.moveDown(0.45);
}

function row(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  left: number,
  width: number,
): void {
  const labelWidth = 110;
  const top = doc.y;
  doc
    .fillColor(MUTED)
    .fontSize(10)
    .font("Helvetica")
    .text(label, left, top, { width: labelWidth });
  const labelBottom = doc.y;
  doc
    .fillColor("#222222")
    .font("Helvetica")
    .text(value, left + labelWidth, top, { width: width - labelWidth });
  doc.y = Math.max(labelBottom, doc.y) + 3;
}
