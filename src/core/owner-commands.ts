export type OwnerCommand =
  | { action: "set_price"; requestId: number; priceEur: number }
  | { action: "add_note"; requestId: number; note: string }
  | { action: "approve"; requestId: number }
  | { action: "reject"; requestId: number; reason?: string }
  | { action: "mark_won"; requestId: number }
  | { action: "mark_lost"; requestId: number }
  | { action: "list" };

/** Parses "900", "€900", "900€", "900,50", "1.200" into a number of euros. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/€/g, "").trim();
  if (!/^[0-9.,\s]+$/.test(cleaned)) return null;
  // Italian format: '.' thousands separator, ',' decimal separator.
  const normalized = cleaned.replace(/[.\s]/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Recognizes the documented owner commands; null means "not a command". */
export function parseOwnerCommand(text: string): OwnerCommand | null {
  const trimmed = text.trim();

  if (/^lista$/i.test(trimmed)) return { action: "list" };

  // "<id> prezzo <importo>" (also "prezzo <id> <importo>")
  let m =
    trimmed.match(/^#?(\d+)\s+prezzo\s+(.+)$/i) ??
    trimmed.match(/^prezzo\s+#?(\d+)\s+(.+)$/i);
  if (m) {
    const amount = parseAmount(m[2]!);
    if (amount === null) return null;
    return { action: "set_price", requestId: Number(m[1]), priceEur: amount };
  }

  // "<id> nota <testo>"
  m = trimmed.match(/^#?(\d+)\s+nota\s+(.+)$/is);
  if (m) return { action: "add_note", requestId: Number(m[1]), note: m[2]!.trim() };

  // "<id> ok" / "ok <id>"
  m = trimmed.match(/^#?(\d+)\s+ok$/i) ?? trimmed.match(/^ok\s+#?(\d+)$/i);
  if (m) return { action: "approve", requestId: Number(m[1]) };

  // "<id> rifiuta <motivo?>"
  m = trimmed.match(/^#?(\d+)\s+rifiuta\s*(.*)$/is);
  if (m) {
    const reason = m[2]?.trim();
    return {
      action: "reject",
      requestId: Number(m[1]),
      ...(reason ? { reason } : {}),
    };
  }

  // "<id> vinto" / "<id> perso"
  m = trimmed.match(/^#?(\d+)\s+vinto$/i);
  if (m) return { action: "mark_won", requestId: Number(m[1]) };
  m = trimmed.match(/^#?(\d+)\s+perso$/i);
  if (m) return { action: "mark_lost", requestId: Number(m[1]) };

  return null;
}
