"""Integration checks for manager login, CSRF, approval, scheduling and public feed."""
import importlib.util
import os
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
import pytest
from fastapi.testclient import TestClient

TEMP=tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"]="sqlite:///"+str(Path(TEMP.name)/"test.sqlite3")
os.environ["PROMOTIONS_ADMIN_EMAIL"]="manager@example.test"
os.environ["PROMOTIONS_ADMIN_PASSWORD"]="Test_Password_With_20_Characters!"
os.environ["PROMOTIONS_COOKIE_SECURE"]="true"
spec=importlib.util.spec_from_file_location("promotions_manager_test",Path(__file__).with_name("main.py"))
manager=importlib.util.module_from_spec(spec)
spec.loader.exec_module(manager)
client=TestClient(manager.app,base_url="https://testserver")
manager.initialize()

def sample(**updates):
    now=datetime.now(ZoneInfo("America/Toronto"))
    data={"name":{"en-CA":"Test Poutine","fr-CA":"Poutine de test","es":"Poutine de prueba"},
          "image":"small-pou.webp", "originalCents":1500,"discountedCents":1200,
          "startDate":now.date().isoformat(),"endDate":now.date().isoformat(),
          "startTime":"00:00","endTime":"23:59",
          "weekdays":[(now.weekday()+1)%7], "approved":True,"enabled":True,
          "redemption":"In-store only for testing"}
    return {**data,**updates}

def login():
    response=client.post("/api/auth/login",json={
        "email":"manager@example.test","password":"Test_Password_With_20_Characters!"})
    assert response.status_code==200,response.text
    return response.json()["csrfToken"]

def headers(csrf):
    return {"X-CSRF-Token":csrf}

def test_security_headers_and_empty_public_feed():
    response=client.get("/")
    assert response.status_code==200
    assert response.headers["x-content-type-options"]=="nosniff"
    assert response.headers["x-frame-options"]=="DENY"
    assert response.headers["referrer-policy"]=="no-referrer"
    assert response.headers["cache-control"]=="no-store"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    public=client.get("/api/promotions")
    assert public.status_code==200
    assert public.json()=={"timeZone":"America/Toronto","offers":[]}

def test_secure_login_and_csrf():
    assert client.get("/api/manage/offers").status_code==401
    assert client.post("/api/auth/login",json={
        "email":"manager@example.test","password":"incorrect"}).status_code==401
    csrf=login()
    assert client.get("/api/manage/offers").status_code==200
    assert client.post("/api/manage/offers",json=sample()).status_code==403
    assert client.post("/api/manage/offers",json=sample(),headers={"X-CSRF-Token":"wrong"}).status_code==403
    assert client.post("/api/auth/logout",headers=headers(csrf)).status_code==200
    assert client.get("/api/manage/offers").status_code==401

def test_create_update_pause_delete_and_audit():
    csrf=login()
    created=client.post("/api/manage/offers",json=sample(),headers=headers(csrf))
    assert created.status_code==201,created.text
    offer_id=created.json()["id"]
    public=client.get("/api/promotions").json()["offers"]
    assert len(public)==1
    assert public[0]["redemption"]=="In-store only for testing"
    assert "id" not in public[0] and "updatedAt" not in public[0]
    updated=client.put(f"/api/manage/offers/{offer_id}",json=sample(discountedCents=1100),headers=headers(csrf))
    assert updated.status_code==200
    assert client.get("/api/promotions").json()["offers"][0]["discountedCents"]==1100
    paused=client.post(f"/api/manage/offers/{offer_id}/pause",headers=headers(csrf))
    assert paused.status_code==200
    assert client.get("/api/promotions").json()["offers"]==[]
    events=client.get("/api/manage/audit").json()["events"]
    assert any(e["action"]=="pause" for e in events)
    assert client.delete(f"/api/manage/offers/{offer_id}",headers=headers(csrf)).status_code==200
    assert client.post("/api/auth/logout",headers=headers(csrf)).status_code==200

@pytest.mark.parametrize("changes",[
    {"approved":False,"enabled":True},
    {"redemption":"","enabled":True},
    {"discountedCents":1500},
    {"image":"../../secret.txt"},
    {"weekdays":[7]},
    {"weekdays":[]},
    {"startDate":"2026-02-30"},
    {"startDate":"2026-12-31","endDate":"2026-01-01"},
    {"startTime":"24:00"},
    {"startTime":"19:00","endTime":"12:00"},
])
def test_invalid_offers_rejected(changes):
    csrf=login()
    response=client.post("/api/manage/offers",json=sample(**changes),headers=headers(csrf))
    assert response.status_code==422,response.text
    assert client.post("/api/auth/logout",headers=headers(csrf)).status_code==200

def test_unapproved_future_and_outside_hours_hidden():
    csrf=login()
    now=datetime.now(ZoneInfo("America/Toronto"))
    future=(now.date()+timedelta(days=1)).isoformat()
    later=(now.date()+timedelta(days=2)).isoformat()
    cases=[sample(enabled=False,approved=False),
           sample(startDate=future,endDate=later),
           sample(startTime="00:00",endTime="00:00")]
    for value in cases:
        result=client.post("/api/manage/offers",json=value,headers=headers(csrf))
        assert result.status_code==201,result.text
        oid=result.json()["id"]
        assert client.get("/api/promotions").json()["offers"]==[]
        assert client.delete(f"/api/manage/offers/{oid}",headers=headers(csrf)).status_code==200
    assert client.post("/api/auth/logout",headers=headers(csrf)).status_code==200

def test_rate_limit_persists_across_failed_requests():
    for _ in range(8):
        response=client.post("/api/auth/login",json={
            "email":"unknown@example.test","password":"not-a-valid-password"})
        assert response.status_code==401,response.text
    response=client.post("/api/auth/login",json={
        "email":"unknown@example.test","password":"not-a-valid-password"})
    assert response.status_code==429


def test_one_time_recovery_preserves_offers_and_cannot_repeat():
    """Recovery is restricted to a pre-existing account and is idempotent."""
    import sys
    sys.modules["main"] = manager
    reset_spec=importlib.util.spec_from_file_location(
        "admin_reset_test",Path(__file__).with_name("reset_admin_once.py"))
    recovery=importlib.util.module_from_spec(reset_spec)
    reset_spec.loader.exec_module(recovery)
    with manager.engine.begin() as conn:
        before=conn.execute(manager.text("SELECT COUNT(*) FROM offers")).scalar_one()
        assert before == 0
        # A second manager must prevent recovery, so an unrelated account is never overwritten.
        conn.execute(manager.text(
            "INSERT INTO managers(email,password_hash) VALUES (:email,:password_hash)"),
            {"email":"another@example.test","password_hash":manager.password_hash("dummy-password-long-enough")})
        try:
            recovery.reset_once(conn,"manager@example.test","new-secret-of-adequate-length")
        except RuntimeError as exc:
            assert "exactly one" in str(exc)
        else:
            raise AssertionError("Recovery must refuse a multi-manager database")
        conn.execute(manager.text("DELETE FROM managers WHERE email=:email"),
                     {"email":"another@example.test"})
    with manager.engine.begin() as conn:
        assert recovery.reset_once(conn,"manager@example.test",
                                  "new-secret-of-adequate-length") == "completed"
        after=conn.execute(manager.text("SELECT COUNT(*) FROM offers")).scalar_one()
        assert after == before
    with manager.engine.begin() as conn:
        assert recovery.reset_once(conn,"manager@example.test",
                                  "new-secret-of-adequate-length") == "already_completed"
        row=conn.execute(manager.text("SELECT password_hash FROM managers WHERE email=:email"),
                         {"email":"manager@example.test"}).first()
        assert manager.password_ok("new-secret-of-adequate-length",row[0])
        assert not manager.password_ok("Test_Password_With_20_Characters!",row[0])
        audit=conn.execute(manager.text(
            "SELECT COUNT(*) FROM audit_log WHERE action='admin_password_recovery'")).scalar_one()
        assert audit == 1
    # The preceding throttle test intentionally locks out the TestClient IP.
    # Clear only that synthetic IP entry to isolate credential verification.
    with manager.engine.begin() as conn:
        conn.execute(manager.text("DELETE FROM auth_attempts WHERE key=:key"),
                     {"key": "ip:" + manager.sha("testclient")})
    response=client.post("/api/auth/login",json={
        "email":"manager@example.test","password":"new-secret-of-adequate-length"})
    assert response.status_code==200,response.text


def test_recovery_repairs_sole_manager_email_on_fresh_database():
    """The sole manager may have been bootstrapped with a wrong email."""
    import sys
    sys.modules["main"]=manager
    spec=importlib.util.spec_from_file_location(
        "admin_reset_email_test",Path(__file__).with_name("reset_admin_once.py"))
    recovery=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(recovery)
    with manager.engine.begin() as conn:
        # Make the test's previous recovery marker irrelevant using an isolated recovery ID.
        old_id=recovery.RECOVERY_ID
        recovery.RECOVERY_ID="test-email-correction-once"
        try:
            assert recovery.reset_once(conn,"corrected@example.test",
                "corrected-password-over-14-chars")=="completed"
            row=conn.execute(manager.text("SELECT email,password_hash FROM managers")).first()
            assert row[0]=="corrected@example.test"
            assert manager.password_ok("corrected-password-over-14-chars",row[1])
        finally:
            recovery.RECOVERY_ID=old_id
