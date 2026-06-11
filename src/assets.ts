/**
 * Authoritative asset directory for the x402 License Gateway.
 * Prices and SHA-256 fingerprints re-baselined 2026-06-11 against the
 * live specs/*.json files, and synchronized 1:1 with the
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
    sha256: "578027543b0e645f663cf9a042b08c84db01e98c55df26e2fab08eb9cf7e56f7",
    version: "1.0.0",
  },
  "vq01-restarules": {
    price_usd: 1.0,
    sha256: "4b355e67369c14365d10411439542d2178971df16a4b7d24b40c91c120d2846e",
    version: "1.0.0",
  },
  "vq02-m2a-handshake": {
    price_usd: 1.0,
    sha256: "8989fb16726481527ff5587986d2885bff8974716201b31353489b855aefd396",
    version: "1.0.0",
  },
  "vq03-trust-receipts": {
    price_usd: 7.0,
    sha256: "e858201865ef1f03f018b18ae9107b19a8bdff099cee6a290871972c2191e57a",
    version: "1.0.0",
  },
  "vq04-rateguard": {
    price_usd: 4.0,
    sha256: "2b7bee8de92164552c002ad67e6230023d1e8affe7ac8a5d83668734e3a45a62",
    version: "1.0.0",
  },
  "vq05-safecard": {
    price_usd: 3.0,
    sha256: "139299f626b00e5e593872bce21df0945286f8cd942eb36eb98d421fd5f0acf6",
    version: "1.0.0",
  },
  "vq06-consent-block": {
    price_usd: 5.0,
    sha256: "eb1eb4a7abe417079105ab0a37e5244376cd80f7e958e20406c320bbcb37e0a3",
    version: "1.0.0",
  },
  "vq07-balance-proof": {
    price_usd: 4.0,
    sha256: "09902631859daede8b6253a57fc5ce47f6aa101b69c25caa1cd81b38d5ca4115",
    version: "1.0.0",
  },
  "vq08-asset-spec": {
    price_usd: 2.0,
    sha256: "6d414c503463e5fd57152097ccfed805e301c46fd782f8c84062062fba10ac1a",
    version: "1.0.0",
  },
  "vq09-auth-header": {
    price_usd: 7.0,
    sha256: "00cb211955b18f590a8a8ee53f759bd6f333f25b800a4f4b1a144eee4b849e29",
    version: "1.0.0",
  },
  "vq10-context-anchor": {
    price_usd: 6.0,
    sha256: "a27a543c735b59be550350362c0bd25eea8244936684dca9125d50d901ade23a",
    version: "1.0.0",
  },
  "vq11-loop-shield": {
    price_usd: 8.0,
    sha256: "6b93e7797f2c58a197f241945263774c7afbae741d3058fd74658ec133897522",
    version: "1.0.0",
  },
  "vq12-agent-vcard": {
    price_usd: 6.0,
    sha256: "20a14ad2bbc609f55bea4414b805023f8ed524db5cd32b0fd6e1a625a93afc24",
    version: "1.0.0",
  },
  "vq13-oauth-delegation": {
    price_usd: 7.0,
    sha256: "0f28c4d468d5d1c49ea54d00d93bf1ef3085fc80b76fa95f17c1ed4b3e7f6cec",
    version: "1.0.0",
  },
  "vq14-state-bridge": {
    price_usd: 6.0,
    sha256: "5caf575b45b60fe781176355b0895761b37c8640e613594a0c4e6eeae8a7b119",
    version: "1.0.0",
  },
  "vq15-scope-discovery": {
    price_usd: 5.0,
    sha256: "7ccb447f1d4bbb665853912773886060f0c8a9d3e91bbb3af6268c05c64f2ca3",
    version: "1.0.0",
  },
  "vq16-notary-proof": {
    price_usd: 8.0,
    sha256: "7c82a6de77da3e8bd97bdb7e9cc74e9f71f5f4c2be51ac00ba9dda5f6238f896",
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
