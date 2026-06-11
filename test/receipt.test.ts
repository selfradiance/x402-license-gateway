import { describe, it, expect } from "vitest";
import {
  ASSET_DIRECTORY,
  ASSET_IDS,
  toAtomicUsdc,
  specUrl,
} from "../src/assets";
import {
  buildSignedReceipt,
  canonicalStringify,
  VERIFICATION_KEY,
} from "../src/receipt";

// Throwaway Ed25519 keypair generated per test run. Never the production key.
async function generateTestKeypair() {
  const pair = (await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const pkcs8 = (await crypto.subtle.exportKey("pkcs8", pair.privateKey)) as ArrayBuffer;
  // Raw 32-byte seed is the last 32 bytes of the PKCS8 envelope.
  const raw = new Uint8Array(pkcs8).slice(-32);
  let binary = "";
  for (const b of raw) binary += String.fromCharCode(b);
  return { privateKeyB64: btoa(binary), publicKey: pair.publicKey };
}

describe("asset directory", () => {
  it("contains exactly 20 assets vq00-vq19", () => {
    expect(ASSET_IDS.length).toBe(20);
    for (let i = 0; i < 20; i++) {
      const prefix = `vq${String(i).padStart(2, "0")}-`;
      expect(ASSET_IDS.some((id) => id.startsWith(prefix))).toBe(true);
    }
  });

  it("every entry has a 64-char hex sha256 and a positive price", () => {
    for (const id of ASSET_IDS) {
      const e = ASSET_DIRECTORY[id];
      expect(e.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(e.price_usd).toBeGreaterThan(0);
      expect(e.price_usd).toBeLessThanOrEqual(8);
    }
  });

  it("converts USD prices to atomic USDC correctly", () => {
    expect(toAtomicUsdc(1.0)).toBe("1000000");
    expect(toAtomicUsdc(8.0)).toBe("8000000");
    expect(toAtomicUsdc(4.0)).toBe("4000000");
  });

  it("builds public spec URLs on the Pages domain", () => {
    expect(specUrl("vq04-rateguard")).toBe(
      "https://selfradiance.github.io/specs/vq04-rateguard.json"
    );
  });
});

describe("license receipt", () => {
  it("issues a receipt whose signature verifies over the canonical JSON", async () => {
    const { privateKeyB64, publicKey } = await generateTestKeypair();
    const envelope = await buildSignedReceipt({
      assetId: "vq04-rateguard",
      assetSha256: ASSET_DIRECTORY["vq04-rateguard"].sha256,
      assetVersion: "1.0.0",
      scheme: "exact",
      network: "eip155:84532",
      amountAtomic: "4000000",
      payer: "0x63CED4a191d0a37da01a6f2aF8d9Eb17b13eDe8b",
      paymentSignatureHeader: btoa(JSON.stringify({ nonce: "test-1" })),
      privateKeyB64,
    });

    expect(envelope.status).toBe("licensed");
    expect(envelope.receipt.schema).toBe("agentic-receipt-v2.2");
    expect(envelope.receipt.asset.sha256).toBe(
      ASSET_DIRECTORY["vq04-rateguard"].sha256
    );
    expect(envelope.receipt.payment.rail).toBe("x402");
    expect(envelope.receipt.receipt_id).toMatch(/^SRX-[0-9A-F]{16}$/);
    expect(envelope.verification_key).toBe(VERIFICATION_KEY);

    const sigBytes = Uint8Array.from(atob(envelope.signature), (ch) =>
      ch.charCodeAt(0)
    );
    const doc = new TextEncoder().encode(
      canonicalStringify(envelope.receipt)
    );
    const valid = await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      sigBytes,
      doc
    );
    expect(valid).toBe(true);
  });

  it("is deterministic per payment: same payload yields same receipt_id, different payload differs", async () => {
    const { privateKeyB64 } = await generateTestKeypair();
    const base = {
      assetId: "vq11-loop-shield",
      assetSha256: ASSET_DIRECTORY["vq11-loop-shield"].sha256,
      assetVersion: "1.0.0",
      scheme: "exact",
      network: "eip155:84532",
      amountAtomic: "8000000",
      payer: "0xabc",
      privateKeyB64,
    };
    const a = await buildSignedReceipt({
      ...base,
      paymentSignatureHeader: "payloadA",
    });
    const b = await buildSignedReceipt({
      ...base,
      paymentSignatureHeader: "payloadA",
    });
    const c = await buildSignedReceipt({
      ...base,
      paymentSignatureHeader: "payloadB",
    });
    expect(a.receipt.receipt_id).toBe(b.receipt.receipt_id);
    expect(a.receipt.receipt_id).not.toBe(c.receipt.receipt_id);
  });

  it("canonicalStringify sorts keys recursively", () => {
    expect(canonicalStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{"a":{"c":3,"d":2},"b":1}'
    );
  });
});
