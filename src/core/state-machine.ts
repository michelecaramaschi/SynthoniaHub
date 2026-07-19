export const STATUSES = [
  "collecting_info",
  "pending_owner",
  "quoted",
  "won",
  "lost",
] as const;

export type QuoteStatus = (typeof STATUSES)[number];

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  collecting_info: ["pending_owner"],
  pending_owner: ["quoted", "lost"],
  quoted: ["won", "lost"],
  won: [],
  lost: [],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: QuoteStatus, to: QuoteStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}

/** Statuses for which a customer message should attach to the existing request. */
export const OPEN_STATUSES: QuoteStatus[] = [
  "collecting_info",
  "pending_owner",
  "quoted",
];
