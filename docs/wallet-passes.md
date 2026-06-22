# Wallet passes (Apple & Google)

Lets customers add their loyalty/perk card to **Apple Wallet** and **Google
Wallet**. No native app — passes are server-generated and delivered via an
"Add to Wallet" link. The **browser card stays the default**; wallet is an
additive, customer-chosen upgrade, gated per-shop (Plus/Max plan).

Branch: `feature/wallet-passes`. Ship Apple + Google together.

## Status

| Milestone | State |
| --- | --- |
| Google Wallet (Android) | ✅ Built — needs issuer creds to go live |
| Apple Wallet (iOS) | 🚧 Scaffolded — provider + APNs web service still to build |

## Architecture

- `src/models/WalletPass.ts` — links a `StampCard` to its pass per provider; stores Apple device push registrations.
- `src/lib/wallet/config.ts` — env-driven provider availability (`isGoogleWalletConfigured`, `isAppleWalletConfigured`, `walletAvailable`). Everything no-ops when unconfigured.
- `src/lib/wallet/google.ts` — Google Wallet: ensure class/object, signed "Save" JWT link, PATCH-to-update.
- `src/lib/wallet/index.ts` — `issueSaveLinks(cardId)` and `syncWalletPasses(cardId)` (provider-agnostic orchestration).
- `POST /api/wallet/save` — customer-facing; returns the save links.
- Approval flow (`/api/stamp-request/[id]`) calls `syncWalletPasses()` fire-and-forget on every stamp/redeem.
- `src/components/add-to-wallet.tsx` — device-aware "Add to Wallet" buttons on the customer card (stamp + perk).
- Shop toggle: Settings → "Wallet passes" (`Shop.walletPasses`, Plus/Max gated).

## Google Wallet — provisioning (to go live)

1. In the **Google Pay & Wallet Console**, create a Wallet API **issuer account**; note the **Issuer ID**.
2. In **Google Cloud**, enable the **Google Wallet API**, create a **service account**, download its **JSON key**.
3. In the Wallet Console, grant that service account access to the issuer.
4. Set env vars (DO App Platform + `.env.local` for dev):
   - `GOOGLE_WALLET_ISSUER_ID` — the numeric issuer id
   - `GOOGLE_WALLET_SA_JSON_BASE64` — `base64 -i service-account.json`
5. Turn on "Wallet passes" for a shop in Settings (requires Plus/Max).

Once set, the customer card shows "Add to Google Wallet"; balances update on each stamp via PATCH.

## Apple Wallet — remaining work (next milestone)

Prereqs: Apple Developer Program ($99/yr), a **Pass Type ID** + signing cert (`.p12`), Apple WWDR cert.

- Env: `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT_BASE64` (+ cert password).
- Build `src/lib/wallet/apple.ts`: generate signed `.pkpass` (e.g. `passkit-generator`), branded from shop logo/colours.
- `GET /api/wallet/apple/[serial].pkpass` — serve the pass.
- PassKit web service routes (register / unregister / get serials / get latest pass / log) under `/api/wallet/apple/v1/...`.
- APNs: on stamp change, push to registered devices so they re-pull the pass. Wire into `syncWalletPasses()` where the `// Apple push` comment is.

## Notes
- Plan gate currently reuses the perk-mode check (`hasPerkMode` = Plus/Max).
- Nothing ships to prod until merged to `main`; the branch does not auto-deploy.
