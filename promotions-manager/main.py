"""SDTH Smart Promotions Manager MVP (independent FastAPI app).

No passwords, tokens or database files belong in source control.
Serve only behind HTTPS with PROMOTIONS_ADMIN_TOKEN set to a long random secret.
The existing static website remains unchanged until a separately approved integration.
"""
import json
import os
import re
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator, model_validator

APP_DIR = Path(__file__).resolve().parent
DATABASE = Path(os.environ.get("PROMOTIONS_DB_PATH", str(APP_DIR / "promotions.sqlite3")))
ADMIN_TOKEN = os.environ.get("PROMOTIONS_ADMIN_TOKEN", "")
PUBLIC_ORIGIN = os.environ.get("PROMOTIONS_PUBLIC_ORIGIN", "https://dbpoutine.com")
ALLOWED_IMAGES = {
    "small-pou.webp", "chicken-pou.webp", "hdcom.webp", "Vpoutinc.webp",
    "8w.webp", "poutinewithhd.webp", "beefp.webp", "chickp.webp",
    "turkeyp.webp", "tusand.webp", "dbsalad.webp"
}
OTTAWA = ZoneInfo("America/Toronto")
app = FastAPI(title="SDTH Smart Promotions Manager", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware, allow_origins=[PUBLIC_ORIGIN], allow_credentials=False,
    allow_methods=["GET"], allow_headers=[]
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Protect manager responses from caching, framing and content sniffing."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; "
        "script-src 'unsafe-inline'; "
        "style-src 'unsafe-inline'; "
        "connect-src 'self'; "
        "img-src 'self'; "
        "base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
    )
    return response

@contextmanager
def db():
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE, timeout=15)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("""CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payload TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 0,
            approved INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        )""")
        connection.commit()
        yield connection
        connection.commit()
    finally:
        connection.close()

class OfferInput(BaseModel):
    name: dict[str, str] = Field(min_length=1)
    image: str
    originalCents: int = Field(gt=0, le=100000000)
    discountedCents: int = Field(ge=0, le=100000000)
    startDate: str
    endDate: str
    weekdays: list[int] = Field(min_length=1, max_length=7)
    approved: bool = False
    enabled: bool = False

    @field_validator("image")
    @classmethod
    def check_image(cls, value):
        if value not in ALLOWED_IMAGES:
            raise ValueError("Choose an existing approved food image")
        return value

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        if not value.get("en-CA", "").strip():
            raise ValueError("English (Canada) meal name required")
        if any(not isinstance(v, str) or not v.strip() or len(v) > 120 for v in value.values()):
            raise ValueError("Invalid meal name")
        return value

    @field_validator("weekdays")
    @classmethod
    def check_days(cls, value):
        if any(type(day) is not int or day < 0 or day > 6 for day in value):
            raise ValueError("Weekdays must be 0 (Sunday) to 6 (Saturday)")
        if len(value) != len(set(value)):
            raise ValueError("Duplicate weekdays")
        return value

    @model_validator(mode="after")
    def check_schedule(self):
        try:
            start = datetime.strptime(self.startDate, "%Y-%m-%d").date()
            end = datetime.strptime(self.endDate, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError("Use real calendar dates in YYYY-MM-DD format") from exc
        if start > end:
            raise ValueError("End date must not precede start date")
        if self.discountedCents >= self.originalCents:
            raise ValueError("Discounted price must be lower than the regular price")
        if self.enabled and not self.approved:
            raise ValueError("Approval required before publishing")
        return self

def authorised(authorization: str = Header(default="")):
    if not ADMIN_TOKEN or len(ADMIN_TOKEN) < 32:
        raise HTTPException(503, "Manager requires PROMOTIONS_ADMIN_TOKEN of at least 32 characters")
    method, _, value = authorization.partition(" ")
    if method.lower() != "bearer" or not secrets.compare_digest(value, ADMIN_TOKEN):
        raise HTTPException(401, "Invalid manager token", headers={"WWW-Authenticate": "Bearer"})
    return True

def row_to_offer(row):
    return {"id": row["id"], **json.loads(row["payload"]),
            "approved": bool(row["approved"]), "enabled": bool(row["enabled"]),
            "updatedAt": row["updated_at"]}

def current_offer(record, now):
    if not record["enabled"] or not record["approved"]:
        return False
    today = now.strftime("%Y-%m-%d")
    day = (now.weekday() + 1) % 7
    return (record["startDate"] <= today <= record["endDate"]
            and day in record["weekdays"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/promotions")
def public_promotions():
    now = datetime.now(OTTAWA)
    with db() as connection:
        rows = connection.execute("SELECT * FROM offers ORDER BY id DESC").fetchall()
    active = [row_to_offer(row) for row in rows]
    return JSONResponse(
        {"timeZone": "America/Toronto", "offers": [
            {key: offer[key] for key in ("approved", "enabled", "startDate",
              "endDate", "weekdays", "name", "image", "originalCents", "discountedCents")}
            for offer in active if current_offer(offer, now)
        ]},
        headers={"Cache-Control": "no-store, max-age=0"}
    )

@app.get("/api/manage/offers", dependencies=[Depends(authorised)])
def list_offers():
    with db() as connection:
        rows = connection.execute("SELECT * FROM offers ORDER BY id DESC").fetchall()
    return {"offers": [row_to_offer(row) for row in rows]}

@app.post("/api/manage/offers", status_code=201, dependencies=[Depends(authorised)])
def add_offer(offer: OfferInput):
    now = datetime.now(OTTAWA).isoformat(timespec="seconds")
    data = offer.model_dump()
    with db() as connection:
        cursor = connection.execute(
            "INSERT INTO offers(payload, enabled, approved, updated_at) VALUES (?,?,?,?)",
            (json.dumps({k:v for k,v in data.items() if k not in ("enabled","approved")}),
             int(offer.enabled), int(offer.approved), now))
    return {"id": cursor.lastrowid, "status": "created"}

@app.put("/api/manage/offers/{offer_id}", dependencies=[Depends(authorised)])
def update_offer(offer_id: int, offer: OfferInput):
    now = datetime.now(OTTAWA).isoformat(timespec="seconds")
    data = offer.model_dump()
    with db() as connection:
        row = connection.execute("SELECT id FROM offers WHERE id=?", (offer_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Offer not found")
        connection.execute(
            "UPDATE offers SET payload=?, enabled=?, approved=?, updated_at=? WHERE id=?",
            (json.dumps({k:v for k,v in data.items() if k not in ("enabled","approved")}),
             int(offer.enabled), int(offer.approved), now, offer_id))
    return {"id": offer_id, "status": "updated"}

@app.post("/api/manage/offers/{offer_id}/pause", dependencies=[Depends(authorised)])
def pause_offer(offer_id: int):
    with db() as connection:
        changed = connection.execute(
            "UPDATE offers SET enabled=0, updated_at=? WHERE id=?",
            (datetime.now(OTTAWA).isoformat(timespec="seconds"), offer_id))
        if changed.rowcount == 0:
            raise HTTPException(404, "Offer not found")
    return {"id": offer_id, "status": "paused"}

@app.delete("/api/manage/offers/{offer_id}", dependencies=[Depends(authorised)])
def delete_offer(offer_id: int):
    with db() as connection:
        changed = connection.execute("DELETE FROM offers WHERE id=?", (offer_id,))
        if changed.rowcount == 0:
            raise HTTPException(404, "Offer not found")
    return {"id": offer_id, "status": "deleted"}

@app.get("/", response_class=HTMLResponse)
def manager_dashboard():
    return (APP_DIR / "dashboard.html").read_text(encoding="utf-8")
