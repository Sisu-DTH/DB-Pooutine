"""Run: cd promotions-manager && pytest -q
Requires the dependencies in requirements.txt.
"""
import importlib.util
import os
import tempfile
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

TMP = tempfile.TemporaryDirectory()
os.environ["PROMOTIONS_DB_PATH"] = str(Path(TMP.name) / "test.sqlite3")
os.environ["PROMOTIONS_ADMIN_TOKEN"] = "test-token-" + "x" * 48
spec = importlib.util.spec_from_file_location("promotions_mvp", Path(__file__).with_name("main.py"))
manager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manager)
client = TestClient(manager.app)
HEADERS = {"Authorization": "Bearer " + os.environ["PROMOTIONS_ADMIN_TOKEN"]}


def example(**changes):
    now = datetime.now(ZoneInfo("America/Toronto"))
    record = {
        "name": {"en-CA": "Test Poutine", "fr-CA": "Poutine de test", "es": "Poutine de prueba"},
        "image": "small-pou.webp",
        "originalCents": 1500,
        "discountedCents": 1200,
        "startDate": now.date().isoformat(),
        "endDate": now.date().isoformat(),
        "weekdays": [(now.weekday() + 1) % 7],
        "approved": True,
        "enabled": True,
    }
    return {**record, **changes}


def test_no_offers_active_initially():
    result = client.get("/api/promotions")
    assert result.status_code == 200
    assert result.json() == {"timeZone": "America/Toronto", "offers": []}
    assert result.headers["cache-control"].startswith("no-store")


def test_authentication_required():
    assert client.get("/api/manage/offers").status_code in (401, 503)
    assert client.get("/api/manage/offers", headers={"Authorization": "Bearer wrong"}).status_code == 401


def test_create_publish_pause_and_delete():
    created = client.post("/api/manage/offers", json=example(), headers=HEADERS)
    assert created.status_code == 201, created.text
    offer_id = created.json()["id"]
    public = client.get("/api/promotions").json()["offers"]
    assert any(o["name"]["en-CA"] == "Test Poutine" for o in public)
    # Public feed must not expose internal manager row IDs or timestamps.
    assert all("id" not in offer and "updatedAt" not in offer for offer in public)

    paused = client.post(f"/api/manage/offers/{offer_id}/pause", headers=HEADERS)
    assert paused.status_code == 200
    assert all(o["name"]["en-CA"] != "Test Poutine" for o in client.get("/api/promotions").json()["offers"])

    updated = client.put(f"/api/manage/offers/{offer_id}", json=example(enabled=False), headers=HEADERS)
    assert updated.status_code == 200
    deleted = client.delete(f"/api/manage/offers/{offer_id}", headers=HEADERS)
    assert deleted.status_code == 200


@pytest.mark.parametrize("overrides", [
    {"approved": False, "enabled": True},
    {"discountedCents": 1500},
    {"image": "../../secrets.txt"},
    {"weekdays": [9]},
    {"weekdays": []},
    {"startDate": "2026-02-30"},
    {"startDate": "2026-12-31", "endDate": "2026-01-01"},
])
def test_invalid_offer_rejected(overrides):
    result = client.post("/api/manage/offers", json=example(**overrides), headers=HEADERS)
    assert result.status_code == 422, result.text


def test_unapproved_and_future_offers_hidden():
    from datetime import timedelta
    now = datetime.now(ZoneInfo("America/Toronto"))
    tomorrow = (now.date() + timedelta(days=1)).isoformat()
    after = (now.date() + timedelta(days=2)).isoformat()
    for data in [example(approved=False, enabled=False),
                 example(startDate=tomorrow, endDate=after)]:
        result = client.post("/api/manage/offers", json=data, headers=HEADERS)
        assert result.status_code == 201
        offer_id = result.json()["id"]
        assert client.get("/api/promotions").json()["offers"] == []
        assert client.delete(f"/api/manage/offers/{offer_id}", headers=HEADERS).status_code == 200
