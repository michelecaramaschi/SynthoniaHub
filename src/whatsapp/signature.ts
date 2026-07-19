import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body.
 * The header format is "sha256=<hex digest of HMAC-SHA256(appSecret, rawBody)>".
 */
export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const received = signatureHeader.slice("sha256=".length);
  const expected = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "utf-8"), Buffer.from(expected, "utf-8"));
}
