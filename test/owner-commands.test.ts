import { describe, expect, it } from "vitest";
import { parseAmount, parseOwnerCommand } from "../src/core/owner-commands.js";

describe("parseAmount", () => {
  it.each([
    ["900", 900],
    ["€900", 900],
    ["900€", 900],
    ["900,50", 900.5],
    ["1.200", 1200],
    ["1.200,50", 1200.5],
    [" 750 ", 750],
  ])("parses %s as %d", (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it.each(["", "abc", "900 circa", "-100", "0"])("rejects %s", (raw) => {
    expect(parseAmount(raw)).toBeNull();
  });
});

describe("parseOwnerCommand", () => {
  it("parses price commands in both orders", () => {
    expect(parseOwnerCommand("42 prezzo 900")).toEqual({
      action: "set_price",
      requestId: 42,
      priceEur: 900,
    });
    expect(parseOwnerCommand("prezzo 42 €900,50")).toEqual({
      action: "set_price",
      requestId: 42,
      priceEur: 900.5,
    });
    expect(parseOwnerCommand("#7 prezzo 1.200")).toEqual({
      action: "set_price",
      requestId: 7,
      priceEur: 1200,
    });
  });

  it("parses notes", () => {
    expect(parseOwnerCommand("42 nota Include allestimento luci base")).toEqual({
      action: "add_note",
      requestId: 42,
      note: "Include allestimento luci base",
    });
  });

  it("parses approval in both orders", () => {
    expect(parseOwnerCommand("42 ok")).toEqual({ action: "approve", requestId: 42 });
    expect(parseOwnerCommand("ok 42")).toEqual({ action: "approve", requestId: 42 });
    expect(parseOwnerCommand("OK 42")).toEqual({ action: "approve", requestId: 42 });
  });

  it("parses rejection with and without reason", () => {
    expect(parseOwnerCommand("42 rifiuta")).toEqual({
      action: "reject",
      requestId: 42,
    });
    expect(parseOwnerCommand("42 rifiuta data già occupata")).toEqual({
      action: "reject",
      requestId: 42,
      reason: "data già occupata",
    });
  });

  it("parses win/loss", () => {
    expect(parseOwnerCommand("42 vinto")).toEqual({ action: "mark_won", requestId: 42 });
    expect(parseOwnerCommand("42 perso")).toEqual({ action: "mark_lost", requestId: 42 });
  });

  it("parses lista", () => {
    expect(parseOwnerCommand("lista")).toEqual({ action: "list" });
    expect(parseOwnerCommand("LISTA")).toEqual({ action: "list" });
  });

  it("returns null for free-form text (rejected, no AI fallback)", () => {
    expect(parseOwnerCommand("per il matrimonio di Giulia direi 900 euro")).toBeNull();
    expect(parseOwnerCommand("ciao")).toBeNull();
    expect(parseOwnerCommand("42 prezzo circa novecento")).toBeNull();
  });
});
