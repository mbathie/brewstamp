# Wallet passes (Apple & Google)

Lets customers add their loyalty/perk card to **Apple Wallet** and **Google
Wallet**. No native app — passes are server-generated and delivered via an
"Add to Wallet" link. The **browser card stays the default**; wallet is an
additive, customer-chosen upgrade, available on **every plan** (toggle per shop).

Branch: `feature/wallet-passes`. Ship Apple + Google together.

## Status

| Milestone | State |
| --- | --- |
| Google Wallet (Android) | ✅ Built + verified — needs issuer creds to go live |
| Apple Wallet (iOS) | ✅ Built (code complete) — needs Apple Developer cert to go live + on-device testing |

## Architecture

- `src/models/WalletPass.ts` — links a `StampCard` to its pass per provider; stores Apple device push registrations.
- `src/lib/wallet/config.ts` — env-driven provider availability (`isGoogleWalletConfigured`, `isAppleWalletConfigured`, `walletAvailable`). Everything no-ops when unconfigured.
- `src/lib/wallet/google.ts` — Google Wallet: ensure class/object, signed "Save" JWT link, PATCH-to-update.
- `src/lib/wallet/apple.ts` — Apple Wallet: build + sign `.pkpass` (passkit-generator), branded from shop logo/colours; `applePushUpdate()` sends empty APNs pushes (cert auth).
- `src/lib/wallet/index.ts` — `issueSaveLinks(cardId)`, `syncWalletPasses(cardId)`, `pkpassForSerial(serial)` (provider-agnostic orchestration).
- `POST /api/wallet/save` — customer-facing; returns the save links.
- `GET /api/wallet/apple/download/[serial]` — initial `.pkpass` download (the Apple save link).
- `/api/wallet/apple/v1/...` — PassKit web service: `passes/[passTypeId]/[serial]` (get latest), `devices/[deviceId]/registrations/[passTypeId]/[serial]` (register/unregister), `devices/[deviceId]/registrations/[passTypeId]` (list updatable), `log`.
- Approval flow (`/api/stamp-request/[id]`) calls `syncWalletPasses()` fire-and-forget on every stamp/redeem.
- `src/components/add-to-wallet.tsx` — device-aware "Add to Wallet" buttons on the customer card (stamp + perk), using each vendor's official badge artwork.
- Shop toggle: Settings → "Wallet passes" (`Shop.walletPasses`); plan gate `PlanConfig.hasWalletPasses` (true on every plan).

## Google Wallet — provisioning (to go live)

1. In the **Google Pay & Wallet Console**, create a Wallet API **issuer account**; note the **Issuer ID**.
2. In **Google Cloud**, enable the **Google Wallet API**, create a **service account**, download its **JSON key**.
3. In the Wallet Console, grant that service account access to the issuer.
4. Set env vars (DO App Platform + `.env.local` for dev):
   - `GOOGLE_WALLET_ISSUER_ID` — the numeric issuer id
   - `GOOGLE_WALLET_SA_JSON_BASE64` — `base64 -i service-account.json`
5. Turn on "Wallet passes" for a shop in Settings (requires Plus/Max).

Once set, the customer card shows "Add to Google Wallet"; balances update on each stamp via PATCH.

## Apple Wallet — provisioning (to go live)

The code is complete and inert until these env vars are set.
`scripts/apple-wallet-setup.ts` automates the openssl + base64 grunt work — you
only do the Apple-portal clicks.

**Prereq: an ACTIVE Apple Developer Program membership** ($99/yr). If it lapses,
the portal shows "Your Apple Developer Program membership has expired" and
blocks Certificates/Identifiers until you **Renew membership** (renewal can take
minutes to a few hours to propagate before the portal unlocks). You can't
re-enroll while expired — you're still the Account Holder — you renew.

1. **Generate a signing key + CSR locally** (the private key is your pass-signing
   key and never leaves your machine):
   ```
   mkdir -p ~/.config/brewstamp/apple && chmod 700 ~/.config/brewstamp/apple
   openssl req -new -newkey rsa:2048 -nodes \
     -keyout ~/.config/brewstamp/apple/signerKey.pem \
     -out    ~/.config/brewstamp/apple/request.certSigningRequest \
     -subj "/CN=Brewstamp Pass Type ID/O=Brewstamp/C=AU"
   ```
2. **Fetch Apple's WWDR G4 intermediate** (public, no login):
   ```
   curl -fsSo ~/.config/brewstamp/apple/AppleWWDRCAG4.cer \
     https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
   ```
3. In the **Apple Developer** portal → Certificates, Identifiers & Profiles:
   - **Identifiers → +** → *Pass Type IDs* → create `pass.app.brewstamp`.
   - **Certificates → +** → *Pass Type ID Certificate* → pick that identifier →
     upload `request.certSigningRequest` → download the `.cer` (e.g. `pass.cer`).
   - Grab your **Team ID** from *Membership details*.
4. **Assemble the env vars** with the helper (handles DER→PEM + base64 +
   validates the key matches the cert and isn't expired):
   ```
   npx tsx scripts/apple-wallet-setup.ts \
     --cert ~/Downloads/pass.cer \
     --key  ~/.config/brewstamp/apple/signerKey.pem \
     --wwdr ~/.config/brewstamp/apple/AppleWWDRCAG4.cer \
     --pass-type-id pass.app.brewstamp --team-id <TEAM_ID>
   ```
   It writes `~/.config/brewstamp/apple/apple-wallet.env` (chmod 600) with
   `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT_BASE64`,
   `APPLE_PASS_KEY_BASE64`, `APPLE_WWDR_BASE64`. (If you exported a Keychain
   `.p12` instead of a separate key, pass `--p12 file.p12 --p12-password …`.)
5. **Wire it up:**
   - Dev: `cat ~/.config/brewstamp/apple/apple-wallet.env >> .env.local`, restart.
   - Prod: add each `APPLE_*` var to DO App Platform (encrypted), redeploy.
   - `NEXT_PUBLIC_APP_URL` must be the public HTTPS origin (Wallet calls the web
     service; APNs needs reachable URLs).
6. Turn on "Wallet passes" for a shop in Settings.

Once set, iOS customers see "Add to Apple Wallet"; the pass registers with the
PassKit web service and stamp changes push via APNs (empty payload → device
re-fetches the pass). Push uses **certificate auth** with the Pass Type ID cert
(`apns-topic` = the pass type id), so no separate APNs key is needed. The cert
expires yearly — re-run steps 3–5 with a fresh cert to rotate.

## Logos — DigitalOcean Spaces

Shop logos are stored in Mongo as **`data:` URIs** (`shop.logo`) for the in-app
card. Wallet providers can't use those:
- **Google** fetches `programLogo`/`heroImage` server-side — a `data:` URI makes
  the loyaltyClass create/update fail with a **500 backendError**, which also
  silently drops the colour update riding in the same PATCH.
- **Apple** bakes the image into the `.pkpass`, so a `data:` URI works there
  (we decode it), but a public URL is cleaner.

Fix: on a logo change, `/api/shop` uploads the image to **DO Spaces** via
`src/lib/spaces.ts` and stores the public URL on **`shop.logoUrl`**. Wallet
builders prefer `logoUrl` over the `data:` URI. Bucket `cultcha`, region `syd1`,
objects under `brewstamp/<dev|prod>/shops/<id>/logo-<hash>.<ext>` (public-read,
content-hashed for cache-busting).

Env: `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`, `SPACES_REGION`,
`SPACES_FOLDER`. No-ops when unset (falls back to the `data:` URI → Google shows
the Brewstamp fallback mark).

## Colour mapping (matches the customer card)
- Pass **background** = the card's `bgColor` (`hexBackgroundColor` on Google;
  `backgroundColor` on Apple). NOT the accent.
- **Google has no text/accent colour field** — it auto-derives white/black for
  contrast. Custom accent text is impossible on Google.
- **Apple** sets `foregroundColor`/`labelColor` = the card's `fgColor` accent,
  so Apple matches the card exactly (dark bg + accent text).

## Notes
- Plan gate is `PlanConfig.hasWalletPasses` — currently true on every plan (Free included; Free is capped at 100 customers).
- Branding edits in Shop Setup push to saved passes via `syncWalletBranding()` (Google class PATCH + Apple APNs).
- Nothing ships to prod until merged to `main`; the branch does not auto-deploy.
