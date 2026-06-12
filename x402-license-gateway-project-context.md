# X402 LICENSE GATEWAY — SESSION STATE (2026-06-12)

## Status: Phases 2, 3, 4-indexing CLOSED. Remaining: single informing pass per v4.2 (deferred by explicit decision). Workspace cleanup completed same day.

## Architecture (unchanged, confirmed live)
Content-public / license-paid for all 20 assets (vq00-vq19). Stripe (human rail, notary) and x402 (machine rail, gateway) share one fulfillment model and one Ed25519 signing key (kid selfradiance-ed25519-2026-01). Receipt schema agentic-receipt-v2.2. Settlement tx hash is NOT inside the signed receipt; it arrives in the PAYMENT-RESPONSE header (still the logged x402-spend-receipt v0.2 candidate).

## Phase 2 (mainnet flip) — CLOSED
- One-line flip ACTIVE = NETWORK_PRESETS.MAINNET in src/index.ts. Gates passed: typecheck, 7/7 tests, dry-run build. Deployed (version 902cc877), committed 185cf86, pushed.
- 402 decode verified raw for vq01-restarules: eip155:8453, USDC 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, amount 1000000, extra name "USD Coin" version "2".
- NOTE: gated routes require full slug IDs (vq01-restarules), bare vq01 returns 404 Unknown asset id.
- Purchase #1: tx 0x2d763143e4462e3b3486ec184914104838859c7c3bc4c365544084dc017de520, settled, 1 USDC, but receipt body was not captured (script printed only top-level keys). Settlement-proven only; superseded.
- buy-mainnet.ts patched: GATED_URL -> gateway vq01-restarules, saves full receipt JSON to buyer/receipt-<timestamp>.json, prints full body.
- Purchase #2 (canonical exit-gate proof): tx 0xd7312064e5b9e0f5a5469d6d19e298d8ede277cb2398edefa7d3a2833f1290d5, Base mainnet, payer 0x63CED4a191d0a37da01a6f2aF8d9Eb17b13eDe8b, receipt_id SRX-20918185EF87F218, receipt saved buyer/receipt-2026-06-12T10-44-44-809Z.json. Three-leg verification ALL PASSED independently: (1) BaseScan settlement success 1 USDC correct parties; (2) Ed25519 signature verifies over canonicalStringify(receipt) against PUBLISHED key from .well-known/issuer-key.json (field name there is publicKeyBase64), inline key matches; verifier: buyer/verify-receipt.mjs (zero-dep node script); (3) live spec sha256 == receipt.asset.sha256 exactly (4b355e67...846e).
- Spend-receipt gate worked as designed: first attempt DENY SESSION_BUDGET_EXCEEDED (2026-06-11 session had recorded 2x $1 ALLOWs against the $2.50 budget without moving money). Fixes: gateway host added to endpoint_host_allowlist, budget raised 2500000 -> 3000000 -> 4000000. Resting state: 4000000/4000000 consumed, next attempt auto-DENYs. Wallet ~$0 USDC; refund before future test buys.
- Caution: Cloudflare blocks python urllib clients on the workers.dev gateway (text/plain 16-byte bot block). Use curl or node fetch for testing.
- All buyer work committed and pushed to x402-paid-endpoint (commit 39cdef4).

## Phase 3 (site sync) — CLOSED
Site repo (~/Desktop/Hermes-LAB/Strategy) commit e2faba2, verified live:
- manifest.json v1.4.0: x402LicenseUrl added to all 20 assets (gateway URL + /license/<id>), confirmed 20/20 live.
- llms.txt: gateway in Machine Discovery; Protocol rewritten as dual rails (2 human/Stripe, 3 machine/x402, 4 verification).
- README.md (the live one is the "Runtime Safety Kit" version, NOT the old "Agentic Assets (Root)" binder copy): gateway in MASTER INDEX, Agent Commerce section rewritten for the 20-asset gateway with purchase #2 tx link, dual-rail step in roadmap. Side effect: old vq00 first-purchase tx link (0x8eb11a82...) dropped from that section; restorable one-liner if wanted.
- check-spec-hashes.mjs: 20 OK, 0 drifted, pre-push.

## Phase 4 (indexing) — CLOSED
- tools.json: x402-license-gateway added as 30th entry, category "Agent Commerce (x402)", with endpointUrl and price "$1.00-$8.00 USDC per license (x402, Base mainnet)" matching sibling entry format. Verified live: count 30.
- llms.txt Working Implementations: gateway line added with annotated format matching x402-paid-endpoint sibling. Site commit 000269e, verified live.
- GitHub profile README (repo selfradiance/selfradiance, local ~/Desktop/projects/selfradiance): same three edits as site README (canonical resources, agent commerce rewrite, dual-rail trust flow). Commit 4dab66c, pushed.
- Informing pass per v4.2: NOT done, explicitly deferred.

## Workspace cleanup (2026-06-12) — DONE
- Discovery: profile README had THREE divergent copies. Live GitHub = "Runtime Safety Kit" version (wins). Local clone was 19 commits behind, fast-forwarded. Hermes-LAB/RESOURCES copy was a dead ancient version, deleted. User's paste-from-RESOURCES workflow memory was stale; new rule: profile README edited ONLY in ~/Desktop/projects/selfradiance via git.
- Deleted: Hermes-LAB/restarules (duplicate, untracked images byte-identical to projects copy), Hermes-LAB/ci-dormant-repos/ (stale restarules+agentgate clones, nothing unique), Hermes-LAB/RESOURCES/.
- restarules now sole copy at ~/Desktop/projects/restarules, pulled current (00f09c5).
- Stash recovered: HARNESS_MAP.md audit edits (marks policy-conflict-receipt and agent-interrupt-receipt shipped, adds selection-state section, prunes covered gaps) applied cleanly, committed 0eb813c, pushed.
- New canonical map: ~/Desktop/Hermes-LAB/FOLDER_MAP.md. Summary: Hermes-LAB/Strategy = live site repo (only canonical Hermes-LAB folder; notary deploys via Cloudflare dashboard paste); everything else lives in ~/Desktop/projects/.

## Standing rules (propagate to binders)
1. Never edit specs/ without running check-spec-hashes.mjs; on drift re-baseline BOTH directories (gateway assets.ts + notary ASSET_DIRECTORY) and redeploy both Workers.
2. Profile README: edit only in ~/Desktop/projects/selfradiance, never web-UI paste.
3. Gated route IDs are full slugs.
4. EIP-712 USDC domain names differ per network (sepolia "USDC", mainnet "USD Coin"); both presets carry correct values.

## Next session candidates
- Informing pass per v4.2 (the deferred Phase 4 tail).
- Optional: restore vq00 historical tx link in site README; refund buyer wallet; bump spend-receipt budget policy for future sessions; x402-spend-receipt v0.2 settlement-linkage work.
- Human-visible x402 surfacing: add "machine-payable via x402" badge/column to human-facing pages (index.html, README catalog tables). Cosmetic only, no functional change.
- Positioning (talked out 2026-06-12, NOT set in concrete): dual framing. (a) Today: credibility artifact — end-to-end mainnet-settled x402 dual-rail implementation, audience is humans. (b) Original thesis stands as a live option: dormant autonomous revenue infrastructure. If agent commerce norms emerge (~2+ yr horizon), receipts gain value and USDC lands in the wallet with zero support burden at $1-$8 price points. Carrying cost is zero (free-tier Worker), so holding the position costs nothing. Reassess as the x402 ecosystem matures; do not frame as PoC-only in binders.
- Pricing: deliberately deferred (2026-06-12). Flat-$1 repricing considered and parked; trigger is first organic purchase signal, not theory. Note repricing touches four synced surfaces (Stripe products must be recreated per price, gateway assets.ts, manifest.json, notary ASSET_DIRECTORY) — treat as a half-day task with hash-drift discipline when triggered.
- Monitoring while dormant: Stripe rail self-announces via email per sale. x402 rail is silent — check USDC arrivals at payTo wallet 0x155463b78af48b2db07583c266b18e35bee4eed7 on Basescan. No active monitoring built; deliberate.
- STRATEGIC (own session, priority): reuse the gateway skeleton (Worker + x402 middleware + Ed25519 receipts + spend-gated buyer + three-leg verification) for an asset with real machine demand — paid API, compute, or non-free data — targeting 6-12 month agent-commerce window instead of license receipts for free specs. Catalog itself stays frozen; no new assets.
