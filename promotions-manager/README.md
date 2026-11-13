# SDTH Smart Promotions Manager — MVP

An isolated FastAPI + SQLite manager for D&B Poutine. **This is not deployed.** The current public D&B Poutine homepage keeps using its existing empty `smart-promotions.json`, so **no offers are active**.

## Features

- Password-like bearer-token access to the manager API; no default administrator token.
- Responsive browser form to create, edit, pause and delete promotions.
- Restaurant approval required before an offer can be enabled.
- Item name translations (Canadian English, optional Canadian French and Spanish), approved photographs, regular/special prices in Canadian dollars.
- Ottawa-local dates and selected weekdays; active offers appear in a public, read-only JSON feed.
- Approval checks, price validation, date validation, approved image filename allowlist, public cache disabled.
- SQLite persistence for one restaurant, without any unnecessary external database service.

## Run locally (Linux / Windows with Python 3.11+)

From the repository root:

```bash
cd promotions-manager
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export PROMOTIONS_ADMIN_TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
printf "Manager token (store securely, do not commit): %s\\n" "$PROMOTIONS_ADMIN_TOKEN"
export PROMOTIONS_DB_PATH="./data/promotions.sqlite3"
uvicorn main:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/` and paste the admin token you generated in that same terminal into the manager's access-token field. The token is stored in the tab's JavaScript memory only, and disappears on refresh or disconnect. Save it securely outside the repository.

### Testing

```bash
pytest -q
```

Tests use a temporary database and synthetic meal/pricing data. They do not affect actual restaurant offers.

## Step 1 — security hardening status

The manager API now sends restrictive response headers: no-store caching, no framing, no referrer leakage, nosniff, and a Content Security Policy. Automated tests assert these headers. The dashboard remains **an isolated development MVP**; this does not amount to a production-grade authentication system.

Before hosting it for a restaurant manager, replace the shared bearer token with per-manager accounts and securely hashed passwords, limited login attempts, secure HttpOnly session cookies, CSRF protection, session expiry, and audit logs. Keep private endpoints inaccessible to untrusted origins. **Do not expose the existing shared-token dashboard on the public internet as the final solution.**

## Integration and deployment — deliberate safety boundary

The deployed static restaurant site currently loads `smart-promotions.json` locally. It **does not yet request the manager's API**. For the manager to publish offers automatically to the live website:

1. Choose HTTPS hosting for the FastAPI application, with durable storage. SQLite needs a persistent disk; an ephemeral container filesystem loses data on redeploy. Alternatively plan a managed PostgreSQL database.
2. Configure the HTTPS service URL, `PROMOTIONS_ADMIN_TOKEN` (>=32 random characters) and a persistent `PROMOTIONS_DB_PATH`. Never commit the token or DB. Keep the manager protected behind HTTPS and preferably additional network access controls.
3. Configure CORS `PROMOTIONS_PUBLIC_ORIGIN=https://dbpoutine.com`.
4. Separately review and change the existing `smart-promotions.js` frontend to read the deployed manager's `/api/promotions` endpoint rather than the static file, with a safe no-offer fallback. Only do this after the API is hosted, tested and approved.
5. Test the public page across mobile and desktop, verify language switching, the timing of same-day offers, cache behaviour and redemption arrangements.
6. Approve the actual offer details and publication. A website advertisement **does not** change external ordering platforms or guarantee the advertised price can be redeemed.

The manager itself has no auto-generated credentials, public administration endpoint, checkout or payments integration. Use a secrets manager for the bearer token. A single shared bearer token is an MVP limitation: for a wider production rollout, add per-manager accounts, permissions, audit history, rate limiting, CSRF-secure login sessions and managed database backups.

## No active offer / fail-safe behaviour

An empty public feed is valid:
```json
{"timeZone":"America/Toronto","offers":[]}
```

An offer is displayed only if it is enabled, approved, within the inclusive date range, and on a selected Ottawa weekday. It is paused by disabling it or clicking **Pause** in the manager.

## Source and business safeguards

This folder is intentionally isolated. It does not overwrite any existing D&B Poutine HTML/CSS/JavaScript, menu prices or images. Existing published site remains unchanged unless a future, separately approved integration is deployed.
