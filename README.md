# x402 License Gateway

x402-payable license gateway for the [Self-Radiance Agent Runtime Safety Kit](https://selfradiance.github.io). Makes all 20 catalog assets purchasable by machines with zero human involvement, per the Machine-buyer principle.

## Model: content-public / license-paid

The specifications themselves are, and remain, freely downloadable from `https://selfradiance.github.io/specs/*.json`. What this gateway sells is a **Sovereign Asset License**: an Ed25519-signed receipt binding your on-chain payment to the asset's SHA-256 fingerprint. Stripe checkout (human buyers) and this gateway (machine buyers) are two payment rails over the same fulfillment model, verified against the same published key.

## Routes

| Route | Access | Returns |
|---|---|---|
| `GET /` | Free | Machine-readable catalog: all 20 assets with price, `specUrl`, `licenseUrl` |
| `GET /license/:assetId` | x402 v2, `exact` scheme, USDC | Signed license receipt (`agentic-receipt-v2.2`) |

Prices match the Stripe rail exactly: $1.00–$8.00 USD per asset, settled in USDC.

## Buyer flow (machine)

1. `GET /` and pick an asset.
2. `GET /license/:assetId` → `402` with a `PAYMENT-REQUIRED` header (x402 v2 payment requirements).
3. Sign an `exact`-scheme payment (EIP-3009, gasless for the buyer) and retry with `PAYMENT-SIGNATURE`.
4. `200` response body is the signed license receipt. The on-chain settlement transaction hash arrives in the `PAYMENT-RESPONSE` header of the same response.
5. Verify: fetch the spec from `receipt.asset.specUrl` location, SHA-256 it, compare to `receipt.asset.sha256`. Verify the Ed25519 signature over the canonical (recursively key-sorted) JSON of the receipt object using the key from `https://selfradiance.github.io/.well-known/issuer-key.json`. Never trust inline keys.

## Receipt schema notes

`agentic-receipt-v2.2` mirrors the notary's v2.1 (same `kid`, same issuer, same canonical serialization, same signing key) with an x402 `payment` block: `rail`, `scheme`, `network`, `amount` (atomic USDC), `payer` (extracted from the verified payment payload), and `payment_payload_sha256` (hash of the buyer's signed `PAYMENT-SIGNATURE` payload, unique per payment, used to seed the deterministic `receipt_id`).

The settlement tx hash is not inside the signed receipt because the x402 middleware settles after the handler builds the response; the buyer binds receipt to settlement via the `PAYMENT-RESPONSE` header delivered alongside it.

## Network

Configured by `NETWORK_PRESETS`/`ACTIVE` in `src/index.ts`. Testnet: base-sepolia (`eip155:84532`). Mainnet: Base (`eip155:8453`). `payTo`: `0x155463b78af48b2db07583c266b18e35bee4eed7`.

## Develop

```bash
npm install
npm run typecheck
npm test
npm run build      # wrangler deploy --dry-run
```

Local dev secrets go in `.dev.vars` (gitignored, see `.dev.vars.example`). Use a throwaway Ed25519 key locally, never the production key.

## Deploy

```bash
wrangler secret put PRIVATE_KEY        # raw 32-byte Ed25519 key, base64 (same key as the notary)
wrangler secret put CDP_API_KEY_ID
wrangler secret put CDP_API_KEY_SECRET
wrangler deploy
```

No KV, no Durable Objects, no queues, no paid Cloudflare features. CDP hosted facilitator free tier.

## Relationship to x402-paid-endpoint

[x402-paid-endpoint](https://github.com/selfradiance/x402-paid-endpoint) was the first end-to-end proof of a machine purchase (content-paid demo, one asset, frozen as the historical proof-of-concept). This gateway is the production pattern: full catalog, license-paid.

## License

MIT
