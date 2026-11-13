# SDTH Smart Promotions Manager — deployment handover

## Current state
This is an isolated development branch and draft PR, not a live manager. **No D&B Poutine website pages, menus, prices or promotions have been changed.** Public `smart-promotions.json` stays empty.

### Implemented
- FastAPI backend with SQLAlchemy and PostgreSQL support (SQLite for local tests).
- A single initial manager account provisioned from environment values; passwords are salted and PBKDF2-hashed.
- HTTP-only, Secure, SameSite=Strict 8-hour cookie sessions with CSRF tokens.
- Login-attempt throttling and protected create/edit/pause/delete endpoints.
- Audit log of manager changes.
- Ottawa date/day/start/end time scheduling and public read-only active-offers feed.
- Approved item image allowlist, cent-based Canadian-dollar prices, restaurant approval, redemption instructions.
- Responsive standalone dashboard with manager email/password sign-in and no browser-persisted password.
- Security headers, automated backend tests and container build.

### Production prerequisites — not yet completed
**Railway connection, hosting project, PostgreSQL service, domain, production secrets, live integration and end-to-end browser verification.** These require access to the hosting account and deployment. The repo is not automatically deployed by this PR.

## Hosting on Railway

1. Connect the Railway account and select repository `Sisu-DTH/DB-Pooutine`.
2. Create a PostgreSQL service, and separately create a service from the same GitHub repository with its **root directory set to `/promotions-manager`**, building from `Dockerfile`.
3. Set private service variables (never commit values):
   - `DATABASE_URL`: a Railway PostgreSQL connection string (ideally an internal/reference connection string).
   - `PROMOTIONS_ADMIN_EMAIL`: approved initial restaurant-manager email.
   - `PROMOTIONS_ADMIN_PASSWORD`: a unique, high-entropy password of at least 14 characters.
   - `PROMOTIONS_PUBLIC_ORIGIN=https://dbpoutine.com`.
   - `PROMOTIONS_COOKIE_SECURE=true`.
4. Require HTTPS, configure the generated application hostname (and optionally a manager-specific subdomain), ensure secrets are stored in Railway, enable database backups and monitor service restart/health.
5. Check `GET /health`, `GET /api/promotions` (must return no offers), then the manager dashboard. Do not publish any restaurant offer as part of provisioning.
6. After creating the manager account, remove `PROMOTIONS_ADMIN_PASSWORD` from the running environment if operationally practical (it is only used for first-time provisioning). Do not share it in ChatGPT messages, logs or screenshots.
7. Only after HTTPS is deployed and verified, change the restaurant's existing frontend to consume `https://<actual-manager-domain>/api/promotions` instead of `smart-promotions.json` with an empty-on-error fallback; run browser/device and language regression checks first.

## Run locally
From the `promotions-manager` directory with Python 3.12:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export DATABASE_URL="sqlite:///$(pwd)/local.sqlite3"
export PROMOTIONS_ADMIN_EMAIL="manager@example.test"
# Set a unique password in your local environment without committing it.
export PROMOTIONS_ADMIN_PASSWORD="<local-secret-at-least-14-characters>"
export PROMOTIONS_COOKIE_SECURE=false
uvicorn main:app --host 127.0.0.1 --port 8000
pytest -q test_main.py
```

To sign into a local instance, visit http://127.0.0.1:8000/. For Railway, use HTTPS only and secure cookies.

## Publish safety
The manager API is currently **not linked** to the public restaurant site. Nothing is advertised on D&B Poutine until a separately reviewed website integration goes live. A displayed discount is an **advertisement**, not a change to checkout prices or third-party ordering channels. The restaurant must approve the exact offer and redemption location beforehand.

### Known boundaries
- Only the initial manager is provisioned. A staff-management UI, password reset, account recovery and multiple manager roles are future work.
- Rate limiting uses the app's observed client network address. On a reverse proxy, configure trusted proxy behaviour carefully and prefer additional edge/WAF rate limiting.
- The current MVP has database audit entries but no export/retention policy.
- The production backend requires a managed PostgreSQL database and tested backups.
- No actual production credentials or hosting services have been created yet.
