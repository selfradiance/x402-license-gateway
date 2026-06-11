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
import { paymentMiddlewareFromConfig } from "@x402/hono";
import type { RoutesConfig } from "@x402/core/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import {
  ASSET_DIRECTORY,
  ASSET_IDS,
  specUrl,
  toAtomicUsdc,
} from "./assets";
import { buildSignedReceipt, ISSUER, VERIFICATION_KEY } from "./receipt";

// ---------------------------------------------------------------------------
// Network configuration. Flip TESTNET/MAINNET here for Phase 2; nothing else
// in the file changes.
// ---------------------------------------------------------------------------
const NETWORK_PRESETS = {
  TESTNET: {
    network: "eip155:84532" as const, // base-sepolia
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  MAINNET: {
    network: "eip155:8453" as const, // base
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};
const ACTIVE = NETWORK_PRESETS.TESTNET;

const PAY_TO = "0x155463b78af48b2db07583c266b18e35bee4eed7";
const SCHEME = "exact";

// ---------------------------------------------------------------------------
// x402 route configuration: one explicit entry per asset, prices matching the
// Stripe rail exactly. Generated from ASSET_DIRECTORY so the two can't drift
// within this repo.
// ---------------------------------------------------------------------------
const routes: RoutesConfig = Object.fromEntries(
  ASSET_IDS.map((assetId) => {
    const entry = ASSET_DIRECTORY[assetId];
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
          },
        },
        description: `Self-Radiance Sovereign Asset License for ${assetId}. Payment returns a signed Ed25519 license receipt. The specification itself is freely available at ${specUrl(assetId)}.`,
        mimeType: "application/json",
        serviceName: "Self-Radiance x402 License Gateway",
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

  app.use(
    paymentMiddlewareFromConfig(
      routes,
      facilitator,
      [{ network: ACTIVE.network, server: new ExactEvmScheme() }]
    )
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
