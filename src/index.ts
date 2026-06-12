/**
 * x402 License Gateway — Self-Radiance Agent Runtime Safety Kit
 *
 * Content-public / license-paid model:
 *   - Specs remain freely fetchable at selfradiance.github.io/specs/*.json
 *   - GET /                      free machine-readable catalog discovery
 *   - GET /license/:assetId     x402-gated (exact scheme, USDC); a settled
 *                               payment returns a signed Ed25519 license
 *                               receipt, NOT the spec content.
 *
 * Phase 1 network: base-sepolia (testnet). Phase 2 flips NETWORK_PRESET.
 */

import { Hono } from "hono";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import type { RoutesConfig } from "@x402/core/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
} from "@x402/extensions/bazaar";
import { createFacilitatorConfig } from "@coinbase/x402";
import {
  ASSET_DIRECTORY,
  ASSET_IDS,
  specUrl,
  toAtomicUsdc,
} from "./assets";
import {
  buildSignedReceipt,
  ISSUER,
  KID,
  RECEIPT_SCHEMA,
  VERIFICATION_KEY,
  type SignedReceiptEnvelope,
} from "./receipt";

// ---------------------------------------------------------------------------
// Network configuration. Flip TESTNET/MAINNET here for Phase 2; nothing else
// in the file changes.
// ---------------------------------------------------------------------------
// EIP-712 domain values are copied verbatim from @x402/evm's
// DEFAULT_STABLECOINS registry. Note they DIFFER between networks:
// sepolia USDC is "USDC", mainnet USDC is "USD Coin". The exact-scheme
// verifier rejects challenges whose extra lacks these.
const NETWORK_PRESETS = {
  TESTNET: {
    network: "eip155:84532" as const, // base-sepolia
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    eip712: { name: "USDC", version: "2" },
  },
  MAINNET: {
    network: "eip155:8453" as const, // base
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    eip712: { name: "USD Coin", version: "2" },
  },
};
const ACTIVE = NETWORK_PRESETS.MAINNET;

const PAY_TO = "0x155463b78af48b2db07583c266b18e35bee4eed7";
const SCHEME = "exact";

type JsonSchema = Record<string, unknown>;

const ASSET_NAME_TOKEN_OVERRIDES: Record<string, string> = {
  m2a: "M2A",
  oauth: "OAuth",
};

function assetName(assetId: string): string {
  return assetId
    .replace(/^vq\d{2}-/, "")
    .split("-")
    .map((token) => {
      const override = ASSET_NAME_TOKEN_OVERRIDES[token];
      return override ?? token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(" ");
}

const EXAMPLE_ASSET_ID = ASSET_IDS[0];
const EXAMPLE_ASSET = ASSET_DIRECTORY[EXAMPLE_ASSET_ID];
const LICENSE_RECEIPT_OUTPUT_EXAMPLE = {
  status: "licensed",
  certification: "Self-Radiance Sovereign Asset License",
  receipt: {
    schema: RECEIPT_SCHEMA,
    kid: KID,
    issuer: ISSUER,
    asset: {
      id: EXAMPLE_ASSET_ID,
      sha256: EXAMPLE_ASSET.sha256,
      version: EXAMPLE_ASSET.version,
    },
    payment: {
      rail: "x402",
      scheme: SCHEME,
      network: ACTIVE.network,
      amount: toAtomicUsdc(EXAMPLE_ASSET.price_usd),
      currency: "USDC",
      payer: "0x63CED4a191d0a37da01a6f2aF8d9Eb17b13eDe8b",
      payment_payload_sha256:
        "0000000000000000000000000000000000000000000000000000000000000000",
    },
    issued_at: "2026-06-12T10:44:44.809Z",
    algorithm: "Ed25519",
    receipt_id: "SRX-20918185EF87F218",
  },
  signature: "base64-ed25519-signature-over-canonical-receipt",
  verification_key: VERIFICATION_KEY,
  verification_key_source: `${ISSUER}/.well-known/issuer-key.json`,
  audit: "v2.2-sovereign-standard-x402",
  note: "The on-chain settlement transaction hash is delivered in the PAYMENT-RESPONSE header of this HTTP response. Download the spec from asset specUrl and verify its SHA-256 against receipt.asset.sha256. Verify the signature over canonicalStringify(receipt) using the key from verification_key_source, never an inline key.",
} satisfies SignedReceiptEnvelope;

const LICENSE_RECEIPT_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", const: "licensed" },
    certification: { type: "string" },
    receipt: {
      type: "object",
      properties: {
        schema: { type: "string", const: RECEIPT_SCHEMA },
        kid: { type: "string" },
        issuer: { type: "string" },
        asset: {
          type: "object",
          properties: {
            id: { type: "string" },
            sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
            version: { type: "string" },
          },
          required: ["id", "sha256", "version"],
          additionalProperties: false,
        },
        payment: {
          type: "object",
          properties: {
            rail: { type: "string", const: "x402" },
            scheme: { type: "string" },
            network: { type: "string" },
            amount: { type: "string" },
            currency: { type: "string", const: "USDC" },
            payer: { type: "string" },
            payment_payload_sha256: {
              type: "string",
              pattern: "^[0-9a-f]{64}$",
            },
          },
          required: [
            "rail",
            "scheme",
            "network",
            "amount",
            "currency",
            "payer",
            "payment_payload_sha256",
          ],
          additionalProperties: false,
        },
        issued_at: { type: "string" },
        algorithm: { type: "string", const: "Ed25519" },
        receipt_id: { type: "string", pattern: "^SRX-[0-9A-F]{16}$" },
      },
      required: [
        "schema",
        "kid",
        "issuer",
        "asset",
        "payment",
        "issued_at",
        "algorithm",
        "receipt_id",
      ],
      additionalProperties: false,
    },
    signature: { type: "string" },
    verification_key: { type: "string" },
    verification_key_source: { type: "string" },
    audit: { type: "string", const: "v2.2-sovereign-standard-x402" },
    note: { type: "string" },
  },
  required: [
    "status",
    "certification",
    "receipt",
    "signature",
    "verification_key",
    "verification_key_source",
    "audit",
    "note",
  ],
  additionalProperties: false,
} satisfies JsonSchema;

// ---------------------------------------------------------------------------
// x402 route configuration: one explicit entry per asset, prices matching the
// Stripe rail exactly. Generated from ASSET_DIRECTORY so the two can't drift
// within this repo.
// ---------------------------------------------------------------------------
const routes: RoutesConfig = Object.fromEntries(
  ASSET_IDS.map((assetId) => {
    const entry = ASSET_DIRECTORY[assetId];
    const name = assetName(assetId);
    return [
      `/license/${assetId}`,
      {
        accepts: {
          scheme: SCHEME,
          payTo: PAY_TO,
          network: ACTIVE.network,
          price: {
            asset: ACTIVE.usdc,
            amount: toAtomicUsdc(entry.price_usd),
            extra: ACTIVE.eip712,
          },
        },
        description: `Sells an Ed25519-signed license receipt (${RECEIPT_SCHEMA}) for ${name} for ${entry.price_usd.toFixed(2)} USDC on Base mainnet.`,
        mimeType: "application/json",
        serviceName: `${name} License`,
        extensions: declareDiscoveryExtension({
          output: {
            example: LICENSE_RECEIPT_OUTPUT_EXAMPLE,
            schema: LICENSE_RECEIPT_OUTPUT_SCHEMA,
          },
        }),
      },
    ];
  })
);

// App is built lazily on first request so CDP credentials can be passed
// explicitly from the Worker env binding. Relying on process.env at module
// scope fails in deployed Workers: the Coinbase helper silently sends no
// auth header when the env vars are absent, and the facilitator sync then
// returns zero supported payment kinds.
function buildApp(env: Env): Hono<{ Bindings: Env }> {
  const facilitator = new HTTPFacilitatorClient(
    createFacilitatorConfig(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET)
  );

  const app = new Hono<{ Bindings: Env }>();
  const server = new x402ResourceServer(facilitator)
    .register(ACTIVE.network, new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);

  app.use(
    paymentMiddleware(routes, server)
  );

// Free discovery route.
app.get("/", (c) => {
  return c.json({
    service: "Self-Radiance x402 License Gateway",
    issuer: ISSUER,
    model: "content-public/license-paid",
    description:
      "All specifications are freely downloadable at their specUrl. Paying the x402 price at licenseUrl returns a signed Ed25519 license receipt binding your payment to the asset's SHA-256 fingerprint. Stripe checkout remains available for human buyers via manifest.json purchaseUrl fields.",
    payment: {
      rail: "x402",
      x402Version: 2,
      scheme: SCHEME,
      network: ACTIVE.network,
      currency: "USDC",
      payTo: PAY_TO,
    },
    verification: {
      algorithm: "Ed25519",
      verification_key: VERIFICATION_KEY,
      verification_key_source: `${ISSUER}/.well-known/issuer-key.json`,
      instruction:
        "Verify receipt signatures over the canonical (recursively key-sorted) JSON of the receipt object. Never trust inline keys; fetch the key from verification_key_source.",
    },
    assets: ASSET_IDS.map((assetId) => {
      const entry = ASSET_DIRECTORY[assetId];
      return {
        id: assetId,
        price_usd: entry.price_usd.toFixed(2),
        amount_atomic_usdc: toAtomicUsdc(entry.price_usd),
        sha256: entry.sha256,
        specUrl: specUrl(assetId),
        licenseUrl: `/license/${assetId}`,
      };
    }),
  });
});

// Gated license route. The x402 middleware has already verified payment by
// the time this handler runs; settlement happens after the handler and the
// settlement tx hash is attached by the middleware in the PAYMENT-RESPONSE
// header of this same response.
app.get("/license/:assetId", async (c) => {
  const assetId = c.req.param("assetId").trim().toLowerCase();
  const entry = ASSET_DIRECTORY[assetId];
  if (!entry) {
    return c.json({ error: "Unknown asset id" }, 404);
  }

  const paymentSignatureHeader = c.req.header("PAYMENT-SIGNATURE") ?? "";

  // Best-effort payer extraction from the verified payment payload
  // (exact scheme EIP-3009 authorization carries `from`). Defensive:
  // receipt issuance never fails on extraction problems.
  let payer = "unknown";
  try {
    const decoded = JSON.parse(atob(paymentSignatureHeader));
    const from =
      decoded?.payload?.authorization?.from ?? decoded?.payload?.from;
    if (typeof from === "string" && from.startsWith("0x")) payer = from;
  } catch {
    // leave payer as "unknown"
  }

  const envelope = await buildSignedReceipt({
    assetId,
    assetSha256: entry.sha256,
    assetVersion: entry.version,
    scheme: SCHEME,
    network: ACTIVE.network,
    amountAtomic: toAtomicUsdc(entry.price_usd),
    payer,
    paymentSignatureHeader,
    privateKeyB64: c.env.PRIVATE_KEY,
  });

  return c.json(envelope);
});

  return app;
}

let cachedApp: Hono<{ Bindings: Env }> | undefined;

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    if (!cachedApp) cachedApp = buildApp(env);
    return cachedApp.fetch(request, env, ctx);
  },
};
