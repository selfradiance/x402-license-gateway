/**
 * License receipt construction and Ed25519 signing.
 *
 * The canonicalStringify and signing logic is ported verbatim from the
 * Self-Radiance notary worker (agentic-receipt-v2.1) so that receipts
 * from both payment rails (Stripe via notary, x402 via this gateway)
 * verify against the same published Ed25519 key:
 *   https://selfradiance.github.io/.well-known/issuer-key.json
 *
 * Schema is bumped to agentic-receipt-v2.2: identical structure, with
 * the `payment` block carrying x402 rail fields instead of a Stripe
 * session. Note on settlement linkage: the x402 middleware settles
 * AFTER the route handler runs, so the on-chain transaction hash is
 * not available at receipt-build time. It is delivered to the buyer in
 * the PAYMENT-RESPONSE header of the same HTTP response. The receipt
 * binds to the payment via payment_payload_sha256 (hash of the buyer's
 * signed PAYMENT-SIGNATURE payload, unique per payment).
 */

export const KID = "selfradiance-ed25519-2026-01";
export const ISSUER = "https://selfradiance.github.io";
export const VERIFICATION_KEY = "LLU9AQt4chCkV6/TBAUxeUSc4nbkN5pBKrZ9V7MYedQ=";
export const RECEIPT_SCHEMA = "agentic-receipt-v2.2";

export interface LicenseReceipt {
  schema: string;
  kid: string;
  issuer: string;
  asset: {
    id: string;
    sha256: string;
    version: string;
  };
  payment: {
    rail: "x402";
    scheme: string;
    network: string;
    amount: string;
    currency: "USDC";
    payer: string;
    payment_payload_sha256: string;
  };
  issued_at: string;
  algorithm: "Ed25519";
  receipt_id?: string;
}

/** Recursive alphabetical key serialization. Ported 1:1 from notary v2.1. */
export function canonicalStringify(obj: unknown): string {
  if (obj === null) return "null";
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalStringify(item)).join(",") + "]";
  }
  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const keyValuePairs = sortedKeys.map(
    (key) => JSON.stringify(key) + ":" + canonicalStringify(record[key])
  );
  return "{" + keyValuePairs.join(",") + "}";
}

export async function sha256Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Import the raw 32-byte Ed25519 private key (base64) via a PKCS8 envelope. Same as notary. */
async function importSigningKey(privateKeyB64: string): Promise<CryptoKey> {
  const privateKeyRaw = base64ToArrayBuffer(privateKeyB64);
  const pkcs8Envelope = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
    0x04, 0x22, 0x04, 0x20,
    ...new Uint8Array(privateKeyRaw),
  ]);
  return crypto.subtle.importKey("pkcs8", pkcs8Envelope, "Ed25519", false, [
    "sign",
  ]);
}

export interface SignedReceiptEnvelope {
  status: "licensed";
  certification: "Self-Radiance Sovereign Asset License";
  receipt: LicenseReceipt;
  signature: string;
  verification_key: string;
  verification_key_source: string;
  audit: "v2.2-sovereign-standard-x402";
  note: string;
}

export async function buildSignedReceipt(params: {
  assetId: string;
  assetSha256: string;
  assetVersion: string;
  scheme: string;
  network: string;
  amountAtomic: string;
  payer: string;
  paymentSignatureHeader: string;
  privateKeyB64: string;
}): Promise<SignedReceiptEnvelope> {
  const paymentPayloadSha256 = await sha256Hex(params.paymentSignatureHeader);

  const receipt: LicenseReceipt = {
    schema: RECEIPT_SCHEMA,
    kid: KID,
    issuer: ISSUER,
    asset: {
      id: params.assetId,
      sha256: params.assetSha256,
      version: params.assetVersion,
    },
    payment: {
      rail: "x402",
      scheme: params.scheme,
      network: params.network,
      amount: params.amountAtomic,
      currency: "USDC",
      payer: params.payer,
      payment_payload_sha256: paymentPayloadSha256,
    },
    issued_at: new Date().toISOString(),
    algorithm: "Ed25519",
  };

  // Deterministic receipt ID: unique per payment (the signed payload nonce
  // makes the header unique), mirroring the notary's session-seeded scheme.
  const deterministicSeed = `${paymentPayloadSha256}:${params.assetId}:${KID}`;
  const receiptIdRaw = await sha256Hex(deterministicSeed);
  receipt.receipt_id = `SRX-${receiptIdRaw.slice(0, 16).toUpperCase()}`;

  const key = await importSigningKey(params.privateKeyB64);
  const document = new TextEncoder().encode(canonicalStringify(receipt));
  const sigBuffer = await crypto.subtle.sign("Ed25519", key, document);

  return {
    status: "licensed",
    certification: "Self-Radiance Sovereign Asset License",
    receipt,
    signature: arrayBufferToBase64(sigBuffer),
    verification_key: VERIFICATION_KEY,
    verification_key_source: `${ISSUER}/.well-known/issuer-key.json`,
    audit: "v2.2-sovereign-standard-x402",
    note: "The on-chain settlement transaction hash is delivered in the PAYMENT-RESPONSE header of this HTTP response. Download the spec from asset specUrl and verify its SHA-256 against receipt.asset.sha256. Verify the signature over canonicalStringify(receipt) using the key from verification_key_source, never an inline key.",
  };
}
