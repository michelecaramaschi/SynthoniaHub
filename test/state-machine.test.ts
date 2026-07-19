import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  type QuoteStatus,
} from "../src/core/state-machine.js";

describe("state machine", () => {
  const allowed: Array<[QuoteStatus, QuoteStatus]> = [
    ["collecting_info", "pending_owner"],
    ["pending_owner", "quoted"],
    ["pending_owner", "lost"],
    ["quoted", "won"],
    ["quoted", "lost"],
  ];

  it.each(allowed)("allows %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  const forbidden: Array<[QuoteStatus, QuoteStatus]> = [
    ["collecting_info", "quoted"],
    ["collecting_info", "won"],
    ["pending_owner", "won"],
    ["quoted", "pending_owner"],
    ["won", "lost"],
    ["lost", "collecting_info"],
  ];

  it.each(forbidden)("forbids %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
    expect(() => assertTransition(from, to)).toThrow(/Invalid status transition/);
  });
});
