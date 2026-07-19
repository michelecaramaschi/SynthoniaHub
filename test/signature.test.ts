import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyMetaSignature } from "../src/whatsapp/signature.js";

const SECRET = "test-app-secret";

function sign(body: Buffer, secret = SECRET): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("verifyMetaSignature", () => {
  const body = Buffer.from(JSON.stringify({ object: "whatsapp_business_account" }));

  it("accepts a valid signature", () => {
    expect(verifyMetaSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = Buffer.from(body.toString() + " ");
    expect(verifyMetaSignature(tampered, sign(body), SECRET)).toBe(false);
  });

  it("rejects a signature from a different secret", () => {
    expect(verifyMetaSignature(body, sign(body, "wrong"), SECRET)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyMetaSignature(body, undefined, SECRET)).toBe(false);
  });

  it("rejects a malformed header", () => {
    expect(verifyMetaSignature(body, "md5=abc", SECRET)).toBe(false);
    expect(verifyMetaSignature(body, "sha256=notahexdigest", SECRET)).toBe(false);
  });
});
