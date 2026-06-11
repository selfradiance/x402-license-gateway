/**
 * Authoritative asset directory for the x402 License Gateway.
 * Prices and SHA-256 fingerprints are synchronized 1:1 with the
 * Self-Radiance notary worker ASSET_DIRECTORY (Stripe rail).
 * Any change here must be mirrored there, and vice versa.
 */

export interface AssetEntry {
  price_usd: number;
  sha256: string;
  version: string;
}

export const SPEC_BASE_URL = "https://selfradiance.github.io/specs";

export const ASSET_DIRECTORY: Record<string, AssetEntry> = {
  "vq00-zion-skank": {
    price_usd: 1.0,
    sha256: "601ee2e30c5862a00e5080b15b99031b9c1309dffb743b04a5a2039dd66ba5ca",
    version: "1.0.0",
  },
  "vq01-restarules": {
    price_usd: 1.0,
    sha256: "62b054f37bcfa946c2d59a3c78b2c2513e39bb9a6ce4f28b138b694630e4a479",
    version: "1.0.0",
  },
  "vq02-m2a-handshake": {
    price_usd: 1.0,
    sha256: "8df91fa387ba9a3d0a173d8c95acd30f72b9e592df602d06e5f9144fd3070e87",
    version: "1.0.0",
  },
  "vq03-trust-receipts": {
    price_usd: 7.0,
    sha256: "16e680b3a5bcd7be622f4ab51c939e32279c71d5c6201b01edc700a5608d9b2e",
    version: "1.0.0",
  },
  "vq04-rateguard": {
    price_usd: 4.0,
    sha256: "13952bc546603f278a3d84bc4466e6370dca98a614a618e58bab37b48d402e45",
    version: "1.0.0",
  },
  "vq05-safecard": {
    price_usd: 3.0,
    sha256: "ee2003eb73620c35e71ce72b7daccc6de6cf5bd5529aac74fb348d5c137f636c",
    version: "1.0.0",
  },
  "vq06-consent-block": {
    price_usd: 5.0,
    sha256: "d1322f6f92e0ef297e743e3280cf7fba366bf66dfc5f0880e2e578afeb509743",
    version: "1.0.0",
  },
  "vq07-balance-proof": {
    price_usd: 4.0,
    sha256: "470810f4d4ae0106328185cf10e1c1d1db12a047387d23b988c75c452393fe23",
    version: "1.0.0",
  },
  "vq08-asset-spec": {
    price_usd: 2.0,
    sha256: "cfc82a68b5d43ef29fa1e0e3cd89f1845c2c1bdbd598629d55a685f70886b272",
    version: "1.0.0",
  },
  "vq09-auth-header": {
    price_usd: 7.0,
    sha256: "3912998da0e68ce543e52877090d44bc4a21e3270b1cf1d8df5db3cef8c65b93",
    version: "1.0.0",
  },
  "vq10-context-anchor": {
    price_usd: 6.0,
    sha256: "679755e19a36abdb45c03e795535734cb649e66ee95ca172f2e8c2003d151c50",
    version: "1.0.0",
  },
  "vq11-loop-shield": {
    price_usd: 8.0,
    sha256: "62accd4922eb8c2a64ccdf6392036fdc3a4b023991b68ef79ef261519e17a5c3",
    version: "1.0.0",
  },
  "vq12-agent-vcard": {
    price_usd: 6.0,
    sha256: "bb29d8a56fdf2f7459e87eb12f75ad8db8c927b1244d4e1f875399a77354ee9e",
    version: "1.0.0",
  },
  "vq13-oauth-delegation": {
    price_usd: 7.0,
    sha256: "0d65e0eee7dc4a7fc9374d0d35f5f01155a388e2f6f7f4a660f02e7713955484",
    version: "1.0.0",
  },
  "vq14-state-bridge": {
    price_usd: 6.0,
    sha256: "b38d228eb6b0b3894b6410016ac0e41e78bfa3316fe457ac6f1447b8e06e2783",
    version: "1.0.0",
  },
  "vq15-scope-discovery": {
    price_usd: 5.0,
    sha256: "2f7eadfb23ea1e2558bb995a86afa76eecf42decf78e4564dcd81dfa50ef54f8",
    version: "1.0.0",
  },
  "vq16-notary-proof": {
    price_usd: 8.0,
    sha256: "5f35cc7fde35f126fc32a6d4783ef3ebc68a72cb6050b4d4eb90d756c16634b2",
    version: "1.0.0",
  },
  "vq17-verifiable-intent": {
    price_usd: 5.0,
    sha256: "c5536858244aa01ce552c86b8e753af0ec14e30f53a679e13ffb21e969a6dcb7",
    version: "1.0.0",
  },
  "vq18-message-signature": {
    price_usd: 6.0,
    sha256: "ef4707a106af58c194b41cba49239c0e8c039c6f3b8c38832133b57539b032b3",
    version: "1.0.0",
  },
  "vq19-nanopay-session": {
    price_usd: 7.0,
    sha256: "4f13874cd1d38e7f7830b02bd186a4db3ac8dc1ebbf7516c93ae82b522627a61",
    version: "1.0.0",
  },
};

export const ASSET_IDS = Object.keys(ASSET_DIRECTORY);

/** USD price to USDC atomic units (6 decimals). */
export function toAtomicUsdc(priceUsd: number): string {
  return String(Math.round(priceUsd * 1_000_000));
}

export function specUrl(assetId: string): string {
  return `${SPEC_BASE_URL}/${assetId}.json`;
}
