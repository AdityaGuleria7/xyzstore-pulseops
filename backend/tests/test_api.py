import os
import subprocess
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def token(email="admin@example.com", password="admin123"):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["token"]


def test_health():
    assert client.get("/api/health").status_code == 200


def test_production_rejects_demo_account_emails():
    env = os.environ.copy()
    env.update({
        "PULSEOPS_ENV": "production",
        "JWT_SECRET": "production-test-secret-that-is-long-enough",
        "ADMIN_EMAIL": "admin@example.com",
        "ADMIN_PASSWORD": "strong-admin-test-password",
        "PACKER_EMAIL": "packer@example.com",
        "PACKER_PASSWORD": "strong-packer-test-password",
        "MONGO_URL": "mongodb://127.0.0.1:27017",
    })
    result = subprocess.run(
        [sys.executable, "-c", "import app"],
        cwd=Path(__file__).resolve().parents[1],
        env=env,
        capture_output=True,
        text=True,
        timeout=5,
    )

    assert result.returncode != 0
    assert "ADMIN_EMAIL, PACKER_EMAIL" in result.stderr


def test_admin_bootstrap_has_250_orders():
    t = token()
    data = client.get("/api/bootstrap", headers={"Authorization": f"Bearer {t}"}).json()
    assert len(data["state"]["orders"]) == 250
    assert len(data["state"]["bays"]) == 6


def test_packer_can_read_fulfillment_inventory_but_not_mutate_it():
    t = token("packer@example.com", "packer123")
    headers = {"Authorization": f"Bearer {t}"}
    data = client.get("/api/bootstrap", headers=headers).json()
    assert data["user"]["role"] == "Packer"
    assert len(data["state"]["inventory"]) == 10
    denied_transfer = client.post("/api/inventory/transfer", json={"sku": "EL-WH-BLK-01", "quantity": 1}, headers=headers)
    denied_audit = client.post("/api/inventory/audit", json={"sku": "EL-WH-BLK-01", "counted": 5}, headers=headers)
    assert denied_transfer.status_code == 403
    assert denied_audit.status_code == 403


def test_admin_can_transfer_stock():
    t = token()
    r = client.post("/api/inventory/transfer", json={"sku": "EL-WH-BLK-01", "quantity": 1}, headers={"Authorization": f"Bearer {t}"})
    assert r.status_code == 200


def test_admin_can_create_issue():
    t = token()
    r = client.post("/api/issues", json={"title": "Test issue", "description": "Testing", "severity": "low", "category": "system", "reportedBy": "Aditya (Owner)"}, headers={"Authorization": f"Bearer {t}"})
    assert r.status_code == 200


def auth_headers(email="admin@example.com", password="admin123"):
    return {"Authorization": f"Bearer {token(email, password)}"}


def test_mutation_returns_undo_and_can_undo():
    headers = auth_headers()
    r = client.post("/api/inventory/transfer", json={"sku": "EL-WH-BLK-01", "quantity": 1}, headers=headers)
    assert r.status_code == 200
    assert r.json()["undo"]["id"]
    undo_id = r.json()["undo"]["id"]
    u = client.post(f"/api/undo/{undo_id}", headers=headers)
    assert u.status_code == 200
    assert u.json()["ok"] is True


def test_wrong_barcode_logs_undoable_error():
    headers = auth_headers()
    order = client.get("/api/orders", headers=headers).json()[0]
    r = client.post(f"/api/orders/{order['id']}/scan", json={"orderId": order["id"], "barcode": "WRONG-TEST-CODE"}, headers=headers)
    assert r.status_code == 409
    detail = r.json()["detail"]
    assert detail["message"] == "Wrong barcode"
    assert detail["undo"]["id"]


def test_inventory_verification_accepts_photo():
    headers = auth_headers()
    before = client.get("/api/inventory", headers=headers).json()[0]
    r = client.post(
        f"/api/inventory/{before['sku']}/verify",
        data={"counted": str(before["quantity"]), "notes": "Shelf photo test"},
        files={"photo": ("shelf.jpg", b"fake-image-bytes", "image/jpeg")},
        headers=headers,
    )
    assert r.status_code == 200
    item = r.json()["item"]
    assert item["verificationStatus"] == "verified"
    assert item["verificationPhotoUrl"].startswith("/media/inventory_verification/")


def test_insights_command_center():
    t = token()
    h = {"Authorization": f"Bearer {t}"}
    d = client.get("/api/insights?minutes_per_order=3&team=3&wave_size=10", headers=h).json()
    assert {"kpis", "radar", "wave", "forecast", "actions"} <= set(d)
    assert len(d["radar"]) == 4
    assert all(r["risk"] in {"clear", "on_track", "at_risk", "will_miss", "missed"} for r in d["radar"])
    # a batch wave never has more stops than orders and is ordered by aisle
    assert d["wave"]["stopsSaved"] >= 0
    aisles = [int(s["location"].split("Aisle")[1].split("·")[0]) for s in d["wave"]["route"]]
    assert aisles == sorted(aisles)
    # forecast ranks critical items first
    ranks = {"critical": 0, "act_now": 1, "watch": 2, "ok": 3}
    r = [ranks[f["level"]] for f in d["forecast"]]
    assert r == sorted(r)


def test_insights_requires_auth_and_clamps_inputs():
    assert client.get("/api/insights").status_code == 401
    h = {"Authorization": f"Bearer {token()}"}
    assert client.get("/api/insights?team=0&minutes_per_order=-5&wave_size=9999", headers=h).status_code == 200


# ---- hardening regressions (state machine, validation, trust boundaries) ----
def _h(email="admin@example.com", pw="admin123"):
    return {"Authorization": f"Bearer {token(email, pw)}"}


def _orders(h):
    return client.get("/api/bootstrap", headers=h).json()["state"]["orders"]


def test_label_price_comes_from_catalog_not_client():
    h = _h()
    client.post("/api/reset", headers=h)
    o = next(x for x in _orders(h) if x["status"] == "pending")
    r = client.post(f"/api/orders/{o['id']}/label", json={"courier": "Royal Mail", "cost": 0.01}, headers=h)
    assert r.status_code == 200 and r.json()["order"]["courierCost"] == 5.9
    assert client.post(f"/api/orders/{o['id']}/label", json={"courier": "Royal Mail", "cost": -1}, headers=h).status_code == 422


def test_cannot_relabel_or_seal_finished_orders():
    h = _h()
    client.post("/api/reset", headers=h)
    shipped = next(x for x in _orders(h) if x["status"] == "shipped")
    assert client.post(f"/api/orders/{shipped['id']}/label", json={"courier": "Royal Mail"}, headers=h).status_code == 409
    assert client.post(f"/api/orders/{shipped['id']}/seal", headers=h).status_code == 409


def test_seal_is_not_repeatable():
    h = _h()
    client.post("/api/reset", headers=h)
    o = next(x for x in _orders(h) if x["status"] == "pending")
    client.post(f"/api/orders/{o['id']}/label", json={"courier": "Royal Mail"}, headers=h)
    for _ in range(o["quantity"]):
        assert client.post(f"/api/orders/{o['id']}/scan", json={"orderId": o["id"], "barcode": o["barcode"]}, headers=h).status_code == 200
    assert client.post(f"/api/orders/{o['id']}/seal", headers=h).status_code == 200
    boxes = client.get("/api/staging/boxes", headers=h).json()
    assert client.post(f"/api/orders/{o['id']}/seal", headers=h).status_code == 409
    assert len(client.get("/api/staging/boxes", headers=h).json()) == len(boxes)


def test_issue_validation_and_trusted_reporter():
    h = _h()
    ok = {"title": "Damaged item", "description": "Box crushed", "severity": "high", "category": "packing", "reportedBy": "Someone Else"}
    r = client.post("/api/issues", json=ok, headers=h)
    assert r.status_code == 200 and r.json()["issue"]["reportedBy"] == "Aditya (Owner)"
    assert client.post("/api/issues", json={**ok, "severity": "zzz"}, headers=h).status_code == 422
    assert client.post("/api/issues", json={**ok, "orderId": "NOPE"}, headers=h).status_code == 404


def test_handover_requires_a_real_signature():
    h = _h()
    assert client.post("/api/staging/handover", json={"courier": "Royal Mail", "signedBy": ""}, headers=h).status_code == 422


def test_shift_briefing_is_plain_english_and_personalised():
    d = client.get("/api/briefing", headers=_h()).json()
    assert d["lines"][0].startswith(("Good morning", "Good afternoon", "Good evening")) and "Aditya" in d["headline"]
    assert len(d["lines"]) >= 3 and all(isinstance(x, str) and x.endswith((".", ")")) for x in d["lines"])
    assert client.get("/api/briefing").status_code == 401
