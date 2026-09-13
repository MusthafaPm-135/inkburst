# KeyraComics administration

The dedicated web entry is `https://keyraadmin.vercel.app/` after Vercel deploys this revision. The existing public storefront stays at `/`. The Android application bundles the same admin experience and uses `https://inkburst-backend.onrender.com/api`.

## Access

Sign in with an existing KeyraComics email/password account whose database role is `admin`. No signup or self-promotion is available in the admin application. Every privileged backend request checks the current role in MySQL; removal takes effect on the next request. Sessions in the dedicated admin client live in session storage and are cleared on logout. Customer accounts cannot enter the workspace. An internet connection is required, including for authorization.

## Features

- Dashboard counts, comic management with image/PDF uploads, coupons, paid orders and invoice PDFs, users, reader activity, customer support.
- Dashboard refresh every 10 seconds while visible; support conversations refresh every 4–5 seconds. Reconnects after connectivity returns. These are live foreground updates, not background push notifications.
- Android supports cover/PDF file selection and native sharing/saving of invoices.
- Failed uploads and deletes never report a successful local-only change.

## Deployment

Existing Vercel project: `keyra` in `musthafapm-135s-projects`, frontend root `frontend`, `npm run build`, output `dist`. Existing Render service: `inkburst-backend`, root `backend`, `npm install`, `npm start`, free instance. Both follow the repository main branch. No new paid resource is needed.

Render retains its existing database, JWT secret, Cloudinary, and other environment variables. Do not replace production secrets or create a new empty database. Optional `ADMIN_URL` allows an additional exact web origin. Android uses the exact origin `https://localhost`. JWT authorization is still required; CORS is not an access-control substitute.

Render free services sleep after inactivity and can take time to wake. Existing database and media accounts have their own quotas, which must be checked in those accounts. Vercel Hobby is for personal, non-commercial use; operating a commercial shop requires a suitable plan/provider. No plan upgrade is configured by this change.

## Android

The `Keyra Admin Android` GitHub Actions workflow builds an installable internal-testing APK and retains it for 30 days. Download the `keyra-admin-android` artifact from a successful run. This is a debug-signed testing build, not a Play Store release. For stable updates or store publication, configure a private release keystore and preserve it securely; never commit signing keys.

Local build: in `frontend`, run `npm ci`, `npm run build:admin`, `npx cap sync android`, then `android/gradlew assembleDebug`. Requires JDK 21 and the Android SDK. Install only on authorized administrators' devices.

## Validation

Run `node --test backend/tests/admin.test.js` and `npm run build --prefix frontend`. The access tests cover anonymous users, customers, revoked roles, database failures, forged tokens, expired tokens, and a current admin.

Before production acceptance, sign in with a real administrator and verify uploads, coupons, invoices, customer support and cross-device refresh against the existing database. No administrator credential or production customer test data is embedded in this repository.
