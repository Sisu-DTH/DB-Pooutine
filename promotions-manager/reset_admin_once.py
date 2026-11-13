"""One-time, database-preserving administrator credential recovery.

Run in Railway as a one-time pre-deploy command: python reset_admin_once.py
Uses existing environment secrets; does not print or accept passwords via CLI.
This operation NEVER creates a manager or deletes offers.
"""
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import text

from main import engine, password_hash

RECOVERY_ID = "sdth-initial-admin-recovery-2026-11-13"


def reset_once(connection, email, password):
    """Recover one existing manager; idempotent for this fixed recovery ID."""
    email = email.strip().lower()
    if not email or "@" not in email or len(password) < 14:
        raise RuntimeError("Recovery requires an administrator email and password of at least 14 characters")

    # Never overwrite an unrelated account or create a new one.
    connection.execute(text("""CREATE TABLE IF NOT EXISTS admin_recovery_runs (
        recovery_id TEXT PRIMARY KEY, manager_id INTEGER NOT NULL,
        completed_at TEXT NOT NULL
    )"""))
    prior = connection.execute(
        text("SELECT manager_id FROM admin_recovery_runs WHERE recovery_id=:id"),
        {"id": RECOVERY_ID}
    ).first()
    if prior:
        return "already_completed"

    account = connection.execute(
        text("SELECT id FROM managers WHERE email=:email"), {"email": email}
    ).first()
    if account is None:
        raise RuntimeError("Recovery refused: configured email does not match an existing manager")

    manager_id = account[0]
    connection.execute(
        text("UPDATE managers SET password_hash=:password_hash WHERE id=:id"),
        {"password_hash": password_hash(password), "id": manager_id}
    )
    # Revoke only this manager's sessions; clear lockout records for the selected email.
    # The current proxy IP-based throttle also expires automatically after 15 minutes.
    connection.execute(text("DELETE FROM sessions WHERE manager_id=:id"), {"id": manager_id})
    from main import sha
    connection.execute(
        text("DELETE FROM auth_attempts WHERE key=:key"), {"key": "email:" + sha(email)}
    )
    connection.execute(
        text("""INSERT INTO admin_recovery_runs(recovery_id,manager_id,completed_at)
             VALUES (:recovery_id,:manager_id,:timestamp)"""),
        {"recovery_id": RECOVERY_ID, "manager_id": manager_id,
         "timestamp": datetime.now(ZoneInfo("America/Toronto")).isoformat(timespec="seconds")}
    )
    connection.execute(
        text("""INSERT INTO audit_log(manager_id,action,offer_id,timestamp)
             VALUES (:manager_id,:action,NULL,:timestamp)"""),
        {"manager_id": manager_id, "action": "admin_password_recovery",
         "timestamp": datetime.now(ZoneInfo("America/Toronto")).isoformat(timespec="seconds")}
    )
    return "completed"


if __name__ == "__main__":
    email = os.environ.get("PROMOTIONS_ADMIN_EMAIL", "")
    password = os.environ.get("PROMOTIONS_ADMIN_PASSWORD", "")
    with engine.begin() as conn:
        outcome = reset_once(conn, email, password)
    # Never print credential values or password hashes.
    print("Administrator recovery:", outcome)
