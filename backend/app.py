# Copyright © 2026 Aditya Guleria. All rights reserved.
# XYZStore · PulseOps — proprietary software.
# Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.

import asyncio
import csv
import io
import logging
import os
import json
import secrets
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse

import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

try:
    import bcrypt
except Exception:  # pragma: no cover
    bcrypt = None

try:
    from pymongo import MongoClient
except Exception:  # pragma: no cover
    MongoClient = None

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
APP_ENV = os.getenv("PULSEOPS_ENV", "development").strip().lower()
DATA_DIR = Path(os.getenv("PULSEOPS_DATA_DIR", str(BASE_DIR / "data"))).expanduser().resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)
MEDIA_DIR = DATA_DIR / "inventory_verification"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
STATE_FILE = DATA_DIR / "state.json"
FRONTEND_BUILD_DIR = BASE_DIR.parent / "frontend" / "build"
MAX_UNDO_ACTIONS = 25
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))

DEMO_ADMIN_EMAIL = "admin@example.com"
DEMO_ADMIN_PASSWORD = "admin123"
DEMO_PACKER_EMAIL = "packer@example.com"
DEMO_PACKER_PASSWORD = "packer123"

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017" if APP_ENV != "production" else "")
DB_NAME = os.getenv("DB_NAME", "pulseops")
JWT_SECRET = os.getenv("JWT_SECRET", "" if APP_ENV == "production" else secrets.token_urlsafe(48))
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", DEMO_ADMIN_EMAIL)
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", DEMO_ADMIN_PASSWORD)
PACKER_EMAIL = os.getenv("PACKER_EMAIL", DEMO_PACKER_EMAIL)
PACKER_PASSWORD = os.getenv("PACKER_PASSWORD", DEMO_PACKER_PASSWORD)

if APP_ENV == "production":
    required = {
        "JWT_SECRET": JWT_SECRET,
        "ADMIN_PASSWORD": ADMIN_PASSWORD,
        "PACKER_PASSWORD": PACKER_PASSWORD,
        "MONGO_URL": MONGO_URL,
        "ADMIN_EMAIL": ADMIN_EMAIL,
        "PACKER_EMAIL": PACKER_EMAIL,
    }
    weak = {
        "JWT_SECRET": len(JWT_SECRET) < 32,
        "ADMIN_PASSWORD": ADMIN_PASSWORD in {"", DEMO_ADMIN_PASSWORD},
        "PACKER_PASSWORD": PACKER_PASSWORD in {"", DEMO_PACKER_PASSWORD},
        "MONGO_URL": not MONGO_URL,
        "ADMIN_EMAIL": not ADMIN_EMAIL.strip() or ADMIN_EMAIL.strip().lower() == DEMO_ADMIN_EMAIL,
        "PACKER_EMAIL": not PACKER_EMAIL.strip() or PACKER_EMAIL.strip().lower() == DEMO_PACKER_EMAIL,
    }
    missing_or_weak = [name for name, value in required.items() if not value or weak[name]]
    if missing_or_weak:
        raise RuntimeError("Production configuration is incomplete or insecure: " + ", ".join(missing_or_weak))
else:
    if not os.getenv("JWT_SECRET"):
        logging.getLogger("pulseops").info("Development JWT secret generated for this process.")
# Real warehouses can still print a label after a cutoff (the box just ships on the next pickup),
# so blocking is opt-in. This also keeps the demo usable at any time of day.
ENFORCE_LABEL_CUTOFF = os.getenv("ENFORCE_LABEL_CUTOFF", "false").lower() in {"1", "true", "yes"}
TOKEN_TTL_HOURS = int(os.getenv("TOKEN_TTL_HOURS", "12"))
APP_TIMEZONE = ZoneInfo(os.getenv("APP_TIMEZONE", "Asia/Kolkata"))

COURIERS = [
    {"name": "Royal Mail", "service": "Tracked Standard", "cost": 5.9, "speed": "3-5 days", "eta": "3-5 days", "pickup": "15:30", "pickupTime": "15:30", "cutoff": "15:00"},
    {"name": "FedEx Ground", "service": "Ground", "cost": 8.1, "speed": "2-3 days", "eta": "2-3 days", "pickup": "17:00", "pickupTime": "17:00", "cutoff": "16:30"},
    {"name": "UPS Next Day", "service": "Next Day", "cost": 11.75, "speed": "Next day", "eta": "Next day", "pickup": "18:15", "pickupTime": "18:15", "cutoff": "18:00"},
    {"name": "DHL Express", "service": "Express", "cost": 14.9, "speed": "Same day", "eta": "Same day", "pickup": "14:30", "pickupTime": "14:30", "cutoff": "14:00"},
]

PRODUCTS = [
    ("Wireless Headphones", "Black", "EL-WH-BLK-01", "8901234567890", "Electronics"),
    ("Mechanical Keyboard", "Blue Switches", "EL-MK-BLU-02", "8901234567891", "Electronics"),
    ("Gaming Mouse", "RGB", "EL-GM-RGB-03", "8901234567892", "Electronics"),
    ("Running Shoes", "White / 10", "AP-RS-10-04", "8901234567893", "Apparel"),
    ("Smart Watch", "Silver", "EL-SW-SLV-05", "8901234567894", "Electronics"),
    ("Yoga Mat", "Purple", "SP-YM-PUR-06", "8902000000001", "Sports"),
    ("Coffee Maker", "Stainless Steel", "HK-CM-SS-07", "8902000000002", "Home"),
    ("Dumbbells", "10lb Pair", "SP-DB-10-08", "8902000000003", "Sports"),
    ("Backpack", "Grey", "AP-BP-GRY-14", "8902000000009", "Apparel"),
    ("Tablet", "64GB / Silver", "EL-TB-64-17", "8902000000012", "Electronics"),
]
NAMES = ["Aarav Sharma", "Diya Mehta", "Rohan Kapoor", "Ananya Singh", "Kabir Verma", "Isha Nair", "Arjun Rao", "Meera Joshi", "Vihaan Shah", "Sara Khan"]
ROADS = ["MG Road", "Indiranagar", "Whitefield", "HSR Layout"]

WORKER_ROSTER = [
    {"id": "USR-ADM-01", "name": "Aditya (Owner)", "email": ADMIN_EMAIL, "role": "Admin", "presentToday": True, "shift": "09:00–18:00"},
    {"id": "USR-PKR-01", "name": "Warehouse Packer", "email": PACKER_EMAIL, "role": "Packer", "presentToday": True, "shift": "09:00–18:00"},
    {"id": "USR-PKR-02", "name": "Riya Singh", "email": "riya@xyzstore.com", "role": "Packer", "presentToday": True, "shift": "10:00–19:00"},
    {"id": "USR-PKR-03", "name": "Arjun Rao", "email": "arjun@xyzstore.com", "role": "Packer", "presentToday": True, "shift": "08:00–17:00"},
    {"id": "USR-PKR-04", "name": "Neha Kapoor", "email": "neha@xyzstore.com", "role": "Packer", "presentToday": False, "shift": "12:00–21:00"},
]

GEO_LOCATIONS = [
    {"city": "Bengaluru", "state": "Karnataka", "country": "India", "lat": 12.9716, "lon": 77.5946},
    {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.0760, "lon": 72.8777},
    {"city": "New Delhi", "state": "Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090},
    {"city": "Hyderabad", "state": "Telangana", "country": "India", "lat": 17.3850, "lon": 78.4867},
    {"city": "Chennai", "state": "Tamil Nadu", "country": "India", "lat": 13.0827, "lon": 80.2707},
    {"city": "Pune", "state": "Maharashtra", "country": "India", "lat": 18.5204, "lon": 73.8567},
    {"city": "London", "state": "England", "country": "United Kingdom", "lat": 51.5074, "lon": -0.1278},
    {"city": "New York", "state": "New York", "country": "United States", "lat": 40.7128, "lon": -74.0060},
    {"city": "Dubai", "state": "Dubai", "country": "United Arab Emirates", "lat": 25.2048, "lon": 55.2708},
    {"city": "Singapore", "state": "Singapore", "country": "Singapore", "lat": 1.3521, "lon": 103.8198},
    {"city": "Toronto", "state": "Ontario", "country": "Canada", "lat": 43.6532, "lon": -79.3832},
    {"city": "Sydney", "state": "New South Wales", "country": "Australia", "lat": -33.8688, "lon": 151.2093},
    {"city": "Tokyo", "state": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503},
    {"city": "Paris", "state": "Île-de-France", "country": "France", "lat": 48.8566, "lon": 2.3522},
    {"city": "São Paulo", "state": "São Paulo", "country": "Brazil", "lat": -23.5505, "lon": -46.6333},
]


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def default_workers() -> list[dict[str, Any]]:
    workers = deepcopy(WORKER_ROSTER)
    now = now_utc()
    for worker in workers:
        worker.setdefault("lastActiveAt", iso(now if worker.get("presentToday") else now - timedelta(days=1)))
    return workers


def geo_for_index(index: int) -> dict[str, Any]:
    point = GEO_LOCATIONS[index % len(GEO_LOCATIONS)]
    return deepcopy(point)


def normalize_legacy_state(state: dict[str, Any]) -> dict[str, Any]:
    state.setdefault("workers", default_workers())
    state.setdefault("printJobs", [])
    state.setdefault("settings", {"storeName": "XYZStore", "tagline": "Fulfillment Control Center"})
    state["settings"].setdefault("storeName", "XYZStore")
    state["settings"].setdefault("tagline", "Fulfillment Control Center")
    for idx, order in enumerate(state.get("orders", [])):
        geo = geo_for_index(idx)
        for key, value in geo.items():
            order.setdefault(key, value)
        order.setdefault("trackingLink", None)
        order.setdefault("trackingId", None)
        order.setdefault("printedAt", None)
        order.setdefault("trackingAddedAt", None)
        order.setdefault("updatedAt", order.get("createdAt") or iso(now_utc()))
        order.setdefault("assignedWorkerId", WORKER_ROSTER[1 + (idx % max(1, len(WORKER_ROSTER) - 1))]["id"])
    worker_map = {w["name"]: w for w in state["workers"]}
    for w in state.get("workers", []):
        w.setdefault("lastActiveAt", iso(now_utc() if w.get("presentToday") else now_utc() - timedelta(days=1)))
    for activity in state.get("activity", []):
        actor = activity.get("actor")
        worker = worker_map.get(actor)
        activity.setdefault("workerId", worker.get("id") if worker else None)
        activity.setdefault("timestamp", iso(now_utc()))
    for box in state.get("boxes", []):
        box.setdefault("trackingLink", None)
        box.setdefault("trackingAddedAt", None)
        box.setdefault("pickedUpAt", None)
        box.setdefault("updatedAt", box.get("pickedUpAt") or iso(now_utc()))
    return state


def seed_state() -> dict[str, Any]:
    now = now_utc()
    orders: list[dict[str, Any]] = []
    # Balanced 500-order workspace across each fulfillment stage.
    stage_sizes = [("received", 140), ("processing", 60), ("picking", 48), ("packing", 30), ("staging", 52), ("shipped", 170)]
    index = 0
    priority_targets = set(range(0, 72))
    critical_targets = set(range(0, 170))
    for logical_stage, size in stage_sizes:
        for _ in range(size):
            idx = index
            product, variant, sku, barcode, category = PRODUCTS[idx % len(PRODUCTS)]
            quantity = (idx % 4) + 1
            if logical_stage == "received":
                status = "pending"
                courier = None
            elif logical_stage == "processing":
                status = "processing"
                courier = None
            elif logical_stage == "picking":
                status = "processing"
                courier = COURIERS[idx % len(COURIERS)]["name"]
            elif logical_stage == "packing":
                status = "packed"
                courier = COURIERS[idx % len(COURIERS)]["name"]
            elif logical_stage == "staging":
                status = "staged"
                courier = COURIERS[idx % len(COURIERS)]["name"]
            else:
                status = "shipped"
                courier = COURIERS[idx % len(COURIERS)]["name"]
            deadline = now - timedelta(minutes=35 + (idx % 45)) if idx in critical_targets else now + timedelta(hours=3 + (idx % 36))
            scanned = quantity if logical_stage in {"packing", "staging", "shipped"} else 0
            geo = geo_for_index(idx)
            assigned_worker = WORKER_ROSTER[1 + (idx % (len(WORKER_ROSTER) - 1))]
            order = {
                "id": f"XYZ-{10001 + idx}",
                "customer": NAMES[idx % len(NAMES)],
                "product": product,
                "variant": variant,
                "sku": sku,
                "barcode": barcode,
                "quantity": quantity,
                "status": status,
                "priority": "priority" if idx in priority_targets else "standard",
                "deadline": iso(deadline),
                "createdAt": iso(now - timedelta(hours=(idx % 72) + 1)),
                "value": 25 + ((idx * 37) % 275),
                "shippingAddress": f"{10 + idx} {ROADS[idx % len(ROADS)]}, {geo['city']}, {geo['state']}, {geo['country']}",
                "city": geo["city"],
                "state": geo["state"],
                "country": geo["country"],
                "latitude": geo["lat"],
                "longitude": geo["lon"],
                "notes": "Express handling required" if idx in priority_targets else None,
                "scanned": scanned,
                "courier": courier,
                "courierCost": next((c["cost"] for c in COURIERS if c["name"] == courier), None),
                "labelCreatedAt": iso(now - timedelta(hours=1)) if courier else None,
                "bay": None,
                "trackingId": None,
                "trackingLink": None,
                "printedAt": None,
                "updatedAt": iso(now),
                "assignedWorkerId": assigned_worker["id"],
            }
            orders.append(order)
            index += 1

    # Inventory: seven LOW/OUT SKUs for the dashboard snapshot, all with WH2 stock.
    low_skus = {"EL-WH-BLK-01", "EL-MK-BLU-02", "EL-GM-RGB-03", "AP-RS-10-04", "EL-SW-SLV-05", "SP-YM-PUR-06", "HK-CM-SS-07"}
    inventory: list[dict[str, Any]] = []
    locations = ["Aisle 1 · Shelf A", "Aisle 1 · Shelf D", "Aisle 2 · Shelf B", "Aisle 3 · Shelf A", "Aisle 3 · Shelf C", "Aisle 4 · Shelf D", "Aisle 5 · Shelf B", "Aisle 6 · Shelf A", "Aisle 7 · Shelf C", "Aisle 8 · Shelf D"]
    for idx, (name, variant, sku, barcode, category) in enumerate(PRODUCTS):
        max_qty = 120
        qty = 10 + idx if sku in low_skus else 70 + (idx * 9)
        reorder = 25
        wh2 = 50 + idx * 12
        inventory.append({
            "id": f"INV-{100 + idx}", "sku": sku, "barcode": barcode, "name": name,
            "variant": variant, "category": category, "quantity": qty,
            "reorderPoint": reorder, "maxQuantity": max_qty, "location": locations[idx],
            "lastUpdated": iso(now - timedelta(minutes=idx * 7)), "wh2Quantity": wh2,
            "verificationStatus": "pending", "verifiedAt": None, "verifiedBy": None,
            "verificationPhotoUrl": None, "verificationNotes": None,
        })

    # 50 staged boxes distributed across the six active bays and couriers.
    bay_distribution = [("B-01", 6), ("B-02", 4), ("B-03", 10), ("B-04", 2), ("B-05", 14), ("B-06", 14)]
    courier_distribution = {"DHL Express": 8, "Royal Mail": 28, "FedEx Ground": 4, "UPS Next Day": 10}
    staged_orders = [o for o in orders if o["status"] == "staged"]
    boxes: list[dict[str, Any]] = []
    cursor = 0
    courier_cursor = 0
    for bay_id, bay_count in bay_distribution:
        for _ in range(bay_count):
            order = staged_orders[cursor % len(staged_orders)]
            cursor += 1
            courier_order = ["DHL Express", "Royal Mail", "FedEx Ground", "UPS Next Day"]
            while courier_cursor < len(courier_order) and sum(1 for b in boxes if b["courier"] == courier_order[courier_cursor]) >= courier_distribution[courier_order[courier_cursor]]:
                courier_cursor += 1
            courier_name = courier_order[min(courier_cursor, len(courier_order) - 1)]
            pickup = now + timedelta(hours={"B-01": 11, "B-02": 5, "B-03": 0.6, "B-04": 0.15, "B-05": 1, "B-06": -1.0}[bay_id])
            box = {
                "id": f"BOX-{91000 + len(boxes)}",
                "orderId": order["id"], "customer": order["customer"],
                "contents": f"{order['product']} ×{order['quantity']}", "weight": f"{0.8 + (cursor % 18) / 10:.1f} kg",
                "scheduledPickup": iso(pickup), "status": "waiting_pickup", "courier": courier_name,
                "trackingId": None, "trackingLink": None, "trackingAddedAt": None, "pickedUpAt": None, "updatedAt": iso(now), "location": bay_id, "scannedIn": True,
            }
            boxes.append(box)
            order["bay"] = bay_id
            order["courier"] = courier_name
            order["courierCost"] = next(c["cost"] for c in COURIERS if c["name"] == courier_name)

    # Six bays and their exact screen-friendly occupancy counts.
    bays: list[dict[str, Any]] = []
    for bay_id, _count in bay_distribution:
        bay_boxes = [b for b in boxes if b["location"] == bay_id]
        courier = bay_boxes[0]["courier"] if bay_boxes else COURIERS[0]["name"]
        pickup = min((datetime.fromisoformat(b["scheduledPickup"]) for b in bay_boxes), default=now + timedelta(hours=4))
        bays.append({"id": bay_id, "name": f"Bay {bay_id}", "capacity": 24, "boxIds": [b["id"] for b in bay_boxes], "courier": courier, "pickupTime": iso(pickup)})

    # Six inbound deliveries with compact, readable line-item chips.
    # Top-level sku/product/qty fields remain for backward compatibility; line items
    # make the UI represent the full inbound consignment without changing its API shape.
    receiving = [
        {"id": "INB-505", "supplier": "PaperPlus Ltd", "poNumber": "PO-5505", "sku": "EL-WH-BLK-01", "product": "Wireless Headphones", "expectedQty": 120, "receivedQty": 0, "status": "pending", "eta": iso(now + timedelta(hours=14)), "dock": "Dock 2", "warehouse": "WH2", "receivedAt": None, "updatedAt": iso(now), "items": [
            {"sku": "EL-WH-BLK-01", "product": "Wireless Headphones", "variant": "Black", "expectedQty": 80, "receivedQty": 0},
            {"sku": "EL-MK-BLU-02", "product": "Mechanical Keyboard", "variant": "Blue Switches", "expectedQty": 40, "receivedQty": 0},
        ]},
        {"id": "INB-502", "supplier": "PaperPlus Ltd", "poNumber": "PO-5502", "sku": "EL-GM-RGB-03", "product": "Gaming Mouse", "expectedQty": 180, "receivedQty": 0, "status": "pending", "eta": iso(now + timedelta(hours=30)), "dock": "Dock 1", "warehouse": "WH2", "receivedAt": None, "updatedAt": iso(now), "items": [
            {"sku": "EL-GM-RGB-03", "product": "Gaming Mouse", "variant": "RGB", "expectedQty": 100, "receivedQty": 0},
            {"sku": "AP-RS-10-04", "product": "Running Shoes", "variant": "White / 10", "expectedQty": 40, "receivedQty": 0},
            {"sku": "HK-CM-SS-07", "product": "Coffee Maker", "variant": "Stainless Steel", "expectedQty": 40, "receivedQty": 0},
        ]},
        {"id": "INB-503", "supplier": "Acme Textiles", "poNumber": "PO-5503", "sku": "AP-RS-10-04", "product": "Running Shoes", "expectedQty": 260, "receivedQty": 0, "status": "pending", "eta": iso(now + timedelta(hours=6)), "dock": "Dock 3", "warehouse": "Main", "receivedAt": None, "updatedAt": iso(now), "items": [
            {"sku": "AP-RS-10-04", "product": "Running Shoes", "variant": "White / 10", "expectedQty": 60, "receivedQty": 0},
            {"sku": "AP-BP-GRY-14", "product": "Backpack", "variant": "Grey", "expectedQty": 100, "receivedQty": 0},
            {"sku": "EL-WH-BLK-01", "product": "Wireless Headphones", "variant": "Black", "expectedQty": 100, "receivedQty": 0},
        ]},
        {"id": "INB-500", "supplier": "Global Mugworks", "poNumber": "PO-5500", "sku": "HK-CM-SS-07", "product": "Coffee Maker", "expectedQty": 160, "receivedQty": 0, "status": "pending", "eta": iso(now + timedelta(hours=9)), "dock": "Dock 1", "warehouse": "Main", "receivedAt": None, "updatedAt": iso(now), "items": [
            {"sku": "HK-CM-SS-07", "product": "Coffee Maker", "variant": "Stainless Steel", "expectedQty": 60, "receivedQty": 0},
            {"sku": "EL-MK-BLU-02", "product": "Mechanical Keyboard", "variant": "Blue Switches", "expectedQty": 40, "receivedQty": 0},
            {"sku": "EL-GM-RGB-03", "product": "Gaming Mouse", "variant": "RGB", "expectedQty": 60, "receivedQty": 0},
        ]},
        {"id": "INB-504", "supplier": "PaperPlus Ltd", "poNumber": "PO-5504", "sku": "AP-BP-GRY-14", "product": "Backpack", "expectedQty": 180, "receivedQty": 0, "status": "pending", "eta": iso(now + timedelta(hours=10)), "dock": "Dock 2", "warehouse": "WH2", "receivedAt": None, "updatedAt": iso(now), "items": [
            {"sku": "AP-BP-GRY-14", "product": "Backpack", "variant": "Grey", "expectedQty": 80, "receivedQty": 0},
            {"sku": "EL-SW-SLV-05", "product": "Smart Watch", "variant": "Silver", "expectedQty": 40, "receivedQty": 0},
            {"sku": "SP-YM-PUR-06", "product": "Yoga Mat", "variant": "Purple", "expectedQty": 60, "receivedQty": 0},
        ]},
        {"id": "INB-501", "supplier": "Acme Textiles", "poNumber": "PO-5501", "sku": "EL-MK-BLU-02", "product": "Mechanical Keyboard", "expectedQty": 300, "receivedQty": 0, "status": "pending", "eta": iso(now + timedelta(hours=12)), "dock": "Dock 4", "warehouse": "WH2", "receivedAt": None, "updatedAt": iso(now), "items": [
            {"sku": "EL-MK-BLU-02", "product": "Mechanical Keyboard", "variant": "Blue Switches", "expectedQty": 100, "receivedQty": 0},
            {"sku": "EL-WH-BLK-01", "product": "Wireless Headphones", "variant": "Black", "expectedQty": 100, "receivedQty": 0},
            {"sku": "EL-GM-RGB-03", "product": "Gaming Mouse", "variant": "RGB", "expectedQty": 100, "receivedQty": 0},
        ]},
    ]

    issues = [
        {"id": "ISS-001", "title": "Missing Stock", "description": "MUG-15OZ shows stock in sheet but shelf empty, transfer requested.", "severity": "critical", "category": "stock", "status": "open", "reportedAt": iso(now - timedelta(minutes=30)), "reportedBy": "System", "aiSuggestion": "Validate shelf count and transfer remaining units from Warehouse 2.", "orderId": None},
        {"id": "ISS-002", "title": "Courier Late", "description": "FedEx pickup arrived 20 min late, minor delay to afternoon batch.", "severity": "low", "category": "courier", "status": "open", "reportedAt": iso(now - timedelta(minutes=25)), "reportedBy": "System", "aiSuggestion": "Confirm revised pickup window and alert the staging lead.", "orderId": None},
        {"id": "ISS-003", "title": "Barcode Unreadable", "description": "Scanner failed to read label on XYZ-10042, relabeled manually.", "severity": "medium", "category": "system", "status": "open", "reportedAt": iso(now - timedelta(minutes=20)), "reportedBy": "System", "aiSuggestion": "Relabel the carton and inspect the scanner head before next wave.", "orderId": "XYZ-10042"},
    ]

    # Seed a compact multi-worker audit trail so supervisors can inspect prior activity.
    activity = []
    seeded_events = [
        ("pick", "Picked Wireless Headphones (2/2)", "Warehouse Packer", "XYZ-10001", 8),
        ("seal", "Sealed box for XYZ-10002", "Riya Singh", "XYZ-10002", 18),
        ("scan_error", "Wrong barcode rejected for XYZ-10010", "Arjun Rao", "XYZ-10010", 32),
        ("pick", "Picked Mechanical Keyboard (1/1)", "Arjun Rao", "XYZ-10011", 41),
        ("seal", "Sealed box for XYZ-10013", "Warehouse Packer", "XYZ-10013", 55),
        ("pick", "Picked Running Shoes (2/3)", "Neha Kapoor", "XYZ-10015", 24 * 60 + 74),
        ("verify", "Verified EL-WH-BLK-01: 18 → 20", "Aditya (Owner)", None, 95),
        ("receive", "Received 60 × Gaming Mouse into WH2", "Riya Singh", None, 124),
        ("handover", "Handover signed for DHL Express by Floor Supervisor: 4 boxes", "Aditya (Owner)", None, 150),
    ]
    for seq, (kind, message, actor, order_id, minutes_ago) in enumerate(seeded_events):
        worker = next((w for w in WORKER_ROSTER if w["name"] == actor), None)
        activity.append({"id": f"ACT-{seq + 1}", "type": kind, "message": message, "actor": actor, "workerId": worker["id"] if worker else None, "timestamp": iso(now - timedelta(minutes=minutes_ago)), "orderId": order_id})

    return {"orders": orders, "inventory": inventory, "boxes": boxes, "issues": issues, "bays": bays, "receiving": receiving, "activity": activity, "couriers": COURIERS, "workers": default_workers(), "printJobs": [], "settings": {"storeName": "XYZStore", "tagline": "Fulfillment Control Center"}}


def expand_legacy_demo_orders(state: dict[str, Any]) -> dict[str, Any]:
    orders = state.get("orders", [])
    if APP_ENV == "production" or len(orders) != 250:
        return state

    seeded = seed_state()
    existing_ids = {order.get("id") for order in orders}
    if existing_ids != {order["id"] for order in seeded["orders"][:250]}:
        return state

    additions = seeded["orders"][250:]
    added_ids = {order["id"] for order in additions}
    state["orders"].extend(additions)

    existing_box_ids = {box.get("id") for box in state.get("boxes", [])}
    boxed_order_ids = {box.get("orderId") for box in state.get("boxes", [])}
    added_boxes = []
    for index, box in enumerate(seeded["boxes"]):
        if box["orderId"] not in added_ids or box["orderId"] in boxed_order_ids:
            continue
        new_box = deepcopy(box)
        if new_box["id"] in existing_box_ids:
            new_box["id"] = f"BOX-{92000 + index}"
        existing_box_ids.add(new_box["id"])
        boxed_order_ids.add(new_box["orderId"])
        state.setdefault("boxes", []).append(new_box)
        added_boxes.append(new_box)

    existing_bays = {bay["id"]: bay for bay in state.get("bays", [])}
    for seeded_bay in seeded["bays"]:
        bay = existing_bays.get(seeded_bay["id"])
        if bay is None:
            bay = deepcopy(seeded_bay)
            state.setdefault("bays", []).append(bay)
            existing_bays[bay["id"]] = bay
        else:
            bay.setdefault("boxIds", [])
            bay["boxIds"].extend(
                box["id"] for box in added_boxes
                if box["location"] == bay["id"] and box["id"] not in bay["boxIds"]
            )
            bay["capacity"] = max(bay.get("capacity", 0), len(bay["boxIds"]) + 2)

    return state


class StateStore:
    def __init__(self) -> None:
        self.state = seed_state()
        self.undo_history: dict[str, list[dict[str, Any]]] = {}
        self.mongo = None
        self.collection = None
        if MongoClient:
            try:
                self.mongo = MongoClient(MONGO_URL, serverSelectionTimeoutMS=800)
                self.mongo.admin.command("ping")
                self.collection = self.mongo[DB_NAME]["pulseops_state"]
                saved = self.collection.find_one({"_id": "singleton"})
                if saved and "state" in saved:
                    self.state = saved["state"]
                else:
                    self.persist()
            except Exception:
                self.mongo = None
                self.collection = None
        if self.collection is None:
            self.load_file()
        self.state = expand_legacy_demo_orders(normalize_legacy_state(self.state))
        self.persist()

    def load_file(self) -> None:
        try:
            if STATE_FILE.exists():
                self.state = json.loads(STATE_FILE.read_text())
        except Exception:
            self.state = seed_state()

    def persist(self) -> None:
        self.state = deepcopy(self.state)
        if self.collection is not None:
            self.collection.replace_one({"_id": "singleton"}, {"_id": "singleton", "state": self.state}, upsert=True)
        else:
            # Atomic local persistence prevents a partially-written state file if the
            # process is interrupted during an operational mutation.
            tmp = STATE_FILE.with_suffix(".json.tmp")
            tmp.write_text(json.dumps(self.state, indent=2), encoding="utf-8")
            tmp.replace(STATE_FILE)

    def reset(self) -> None:
        self.state = seed_state()
        self.persist()


store = StateStore()
if APP_ENV == "production" and store.collection is None:
    raise RuntimeError("Production requires a reachable MongoDB configured through MONGO_URL. Local JSON fallback is disabled in production.")

app = FastAPI(title="XYZStore PulseOps API", version="1.0.0")
cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000" if APP_ENV != "production" else "")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in cors_raw.split(",") if x.strip()],
    allow_credentials=bool(cors_raw.strip()),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(self), microphone=(self)")
    response.headers.setdefault("X-PulseOps-Ownership", "Copyright 2026 Aditya Guleria - All Rights Reserved")
    response.headers.setdefault("X-PulseOps-License", "PROPRIETARY")
    if APP_ENV == "production":
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

_MUTATION_LOCK = asyncio.Lock()


@app.middleware("http")
async def serialize_mutations(request, call_next):
    """Operational writes are applied one at a time so two packers can never
    interleave a read-modify-write on the shared state (double-picks, lost undo)."""
    if request.method in {"POST", "PATCH", "PUT", "DELETE"}:
        async with _MUTATION_LOCK:
            return await call_next(request)
    return await call_next(request)


app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

# Serve the compiled Vite assets used by the SPA. Without this mount, the root HTML
# loads successfully but /assets/* requests fall through to the SPA catch-all and
# return 404s, leaving the production page blank.
FRONTEND_ASSETS_DIR = FRONTEND_BUILD_DIR / "assets"
if FRONTEND_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="frontend_assets")

# Vite public assets are copied to the build root (for example favicons or brand files).
# Serve known files from the build output without interfering with API routes.


def public_user(email: str, role: str) -> dict[str, str]:
    if role == "Admin":
        return {"name": "Aditya (Owner)", "email": email, "role": role, "initials": "AO"}
    return {"name": "Warehouse Packer", "email": email, "role": role, "initials": "WP"}


def check_credentials(email: str, password: str) -> tuple[str, str] | None:
    if secrets.compare_digest(email.lower().strip(), ADMIN_EMAIL.lower().strip()) and secrets.compare_digest(password, ADMIN_PASSWORD):
        return "Admin", "Aditya (Owner)"
    if secrets.compare_digest(email.lower().strip(), PACKER_EMAIL.lower().strip()) and secrets.compare_digest(password, PACKER_PASSWORD):
        return "Packer", "Warehouse Packer"
    return None


def issue_token(email: str, role: str) -> str:
    return jwt.encode({"sub": email, "role": role, "name": public_user(email, role)["name"], "exp": int((now_utc() + timedelta(hours=TOKEN_TTL_HOURS)).timestamp())}, JWT_SECRET, algorithm="HS256")


def bearer_user(authorization: Optional[str] = None) -> dict[str, str]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"email": str(payload["sub"]), "role": str(payload["role"]), "name": str(payload.get("name", ""))}
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


# Use Header dependency without pulling all auth logic into every endpoint.
from fastapi import Header


def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict[str, str]:
    return bearer_user(authorization)


def admin_only(user: dict[str, str] = Depends(get_current_user)) -> dict[str, str]:
    if user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class LoginRequest(BaseModel):
    email: str
    password: str


class LabelRequest(BaseModel):
    courier: str = Field(min_length=1, max_length=60)
    cost: Optional[float] = Field(default=None, ge=0)  # ignored: price always comes from the courier catalog


class BatchRequest(BaseModel):
    orderIds: list[str] = Field(default_factory=list)


class TrackingRequest(BaseModel):
    trackingLink: str = Field(min_length=8, max_length=500)


class TransferRequest(BaseModel):
    sku: str
    quantity: int = Field(gt=0)


class AuditRequest(BaseModel):
    sku: str
    counted: int = Field(ge=0)


class ReceiveRequest(BaseModel):
    id: str
    quantity: int = Field(gt=0)
    sku: str | None = None


class ScanRequest(BaseModel):
    orderId: str
    barcode: str


class HandoverRequest(BaseModel):
    courier: str = Field(min_length=1, max_length=60)
    signedBy: str = Field(default="Floor Supervisor", min_length=2, max_length=80)


class StageAssignRequest(BaseModel):
    boxId: str
    bayId: str


class StageScanRequest(BaseModel):
    boxId: str
    bayId: Optional[str] = None


ISSUE_SEVERITIES = {"low", "medium", "high", "critical"}
ISSUE_CATEGORIES = {"stock", "courier", "packing", "shipping", "system"}  # must match frontend ISSUE_CATEGORY_META


class IssueCreate(BaseModel):
    title: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=3, max_length=600)
    severity: str = "medium"
    category: str = "system"
    reportedBy: Optional[str] = None  # accepted for old clients but never trusted
    orderId: Optional[str] = Field(default=None, max_length=40)


class IssueStatusRequest(BaseModel):
    status: str


class InventoryImportRequest(BaseModel):
    items: list[dict[str, Any]]


class StoreSettingsRequest(BaseModel):
    storeName: str = Field(min_length=1, max_length=80)
    tagline: str = Field(default="Fulfillment Control Center", max_length=120)



def create_undo(user: dict[str, str], label: str) -> dict[str, Any]:
    """Capture the complete state before a mutating API call. Only the most recent
    mutation per user is undoable, which prevents an old undo from overwriting
    newer operational work."""
    undo_id = secrets.token_urlsafe(12)
    bucket = store.undo_history.setdefault(user["email"], [])
    bucket.append({
        "id": undo_id,
        "label": label,
        "createdAt": iso(now_utc()),
        "state": deepcopy(store.state),
    })
    if len(bucket) > MAX_UNDO_ACTIONS:
        del bucket[:-MAX_UNDO_ACTIONS]
    return {"id": undo_id, "label": label, "expiresInSeconds": 30}


def undo_detail(undo: dict[str, Any]) -> dict[str, Any]:
    return {"id": undo["id"], "label": undo["label"], "expiresInSeconds": undo.get("expiresInSeconds", 30)}


def add_activity(kind: str, message: str, actor: str, order_id: Optional[str] = None) -> None:
    created = now_utc()
    aid = f"ACT-{created.timestamp()}"
    worker = next((w for w in store.state.get("workers", []) if w.get("name") == actor), None)
    if worker:
        worker["lastActiveAt"] = iso(created)
        worker["presentToday"] = True
    store.state["activity"].insert(0, {
        "id": aid, "type": kind, "message": message, "actor": actor,
        "workerId": worker.get("id") if worker else None,
        "timestamp": iso(created), "orderId": order_id
    })
    store.state["activity"] = store.state["activity"][:2000]


def find_order(order_id: str) -> dict[str, Any]:
    order = next((x for x in store.state["orders"] if x["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def find_inventory(sku: str) -> dict[str, Any]:
    item = next((x for x in store.state["inventory"] if x["sku"] == sku), None)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


def touch_order(order: dict[str, Any]) -> None:
    order["updatedAt"] = iso(now_utc())


def persist_and_state() -> dict[str, Any]:
    store.persist()
    return deepcopy(store.state)


def best_courier() -> dict[str, Any]:
    current = datetime.now(APP_TIMEZONE)
    eligible = []
    for courier in COURIERS:
        h, m = [int(x) for x in courier["cutoff"].split(":")]
        cutoff = current.replace(hour=h, minute=m, second=0, microsecond=0)
        if current < cutoff:
            eligible.append(courier)
    return sorted(eligible or COURIERS, key=lambda c: c["cost"])[0]


def add_staged_box(order: dict[str, Any], actor: str) -> dict[str, Any]:
    """Create and place a staged box for a sealed order, keeping bay occupancy consistent."""
    existing = next((b for b in store.state["boxes"] if b["orderId"] == order["id"] and b["status"] != "picked_up"), None)
    if existing:
        return existing
    if not order.get("courier"):
        courier = best_courier()
        order["courier"] = courier["name"]
        order["courierCost"] = courier["cost"]
    bay = min(store.state["bays"], key=lambda b: len(b["boxIds"]) / max(1, b["capacity"]))
    box = {
        "id": f"BOX-{int(now_utc().timestamp() * 1000) % 900000}",
        "orderId": order["id"],
        "customer": order["customer"],
        "contents": f"{order['product']} ×{order['quantity']}",
        "weight": f"{0.8 + (order.get('quantity', 1) * 0.2):.1f} kg",
        "scheduledPickup": iso(now_utc() + timedelta(hours=2)),
        "status": "waiting_pickup",
        "courier": order["courier"],
        "trackingId": None,
        "trackingLink": None,
        "pickedUpAt": None,
        "trackingAddedAt": None,
        "updatedAt": iso(now_utc()),
        "location": bay["id"],
        "scannedIn": True,
    }
    store.state["boxes"].insert(0, box)
    bay["boxIds"].append(box["id"])
    order["bay"] = bay["id"]
    add_activity("seal", f"Staged {box['id']} in {bay['id']}", actor, order["id"])
    return box


@app.get("/api/health")
def health() -> dict[str, Any]:
    storage = "mongodb" if store.collection is not None else "json-file"
    return {"ok": True, "service": "pulseops-api", "environment": APP_ENV, "storage": storage, "time": iso(now_utc())}


@app.post("/api/auth/login")
def login(request: LoginRequest) -> dict[str, Any]:
    result = check_credentials(request.email, request.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    role, _name = result
    return {"token": issue_token(request.email, role), "user": public_user(request.email, role)}


@app.get("/api/bootstrap")
def bootstrap(user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    state = deepcopy(store.state)
    # Packers can read shelf/product data needed for picking; write operations stay admin-only on the server.
    return {"user": public_user(user["email"], user["role"]), "state": state, "bestCourier": best_courier()}


@app.put("/api/settings")
def update_settings(request: StoreSettingsRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    clean_name = " ".join(request.storeName.strip().split())
    if not clean_name:
        raise HTTPException(status_code=400, detail="Store name is required")
    undo = create_undo(user, "Update store settings")
    store.state.setdefault("settings", {})["storeName"] = clean_name
    store.state["settings"]["tagline"] = request.tagline.strip() or "Fulfillment Control Center"
    add_activity("settings", f"Updated store branding to {clean_name}", user["name"])
    persist_and_state()
    return {"settings": deepcopy(store.state["settings"]), "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.get("/api/couriers")
def couriers(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return COURIERS


@app.get("/api/orders")
def list_orders(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return deepcopy(store.state["orders"])


@app.get("/api/inventory")
def list_inventory(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return deepcopy(store.state["inventory"])


@app.get("/api/staging/bays")
def list_staging_bays(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return deepcopy(store.state["bays"])


@app.get("/api/staging/boxes")
def list_staging_boxes(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return deepcopy(store.state["boxes"])


@app.get("/api/receiving")
def list_receiving(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return deepcopy(store.state["receiving"])


@app.get("/api/issues")
def list_issues(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return deepcopy(store.state["issues"])


@app.get("/api/workers/logs")
def worker_logs(user: dict[str, str] = Depends(admin_only)) -> list[dict[str, Any]]:
    workers = []
    for worker in store.state.get("workers", []):
        mine = [a for a in store.state.get("activity", []) if a.get("workerId") == worker.get("id") or a.get("actor") == worker.get("name")]
        stats = {
            "unitsPicked": sum(1 for a in mine if a.get("type") == "pick"),
            "misScans": sum(1 for a in mine if a.get("type") == "scan_error"),
            "boxesSealed": sum(1 for a in mine if a.get("type") == "seal"),
            "ordersHandled": len({a.get("orderId") for a in mine if a.get("orderId")}),
        }
        workers.append({**deepcopy(worker), "stats": stats, "recentActivity": mine[:25]})
    return workers


@app.get("/api/activity")
def list_activity(user: dict[str, str] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return deepcopy(store.state["activity"][:500])


@app.post("/api/orders/{order_id}/label")
def create_label(order_id: str, request: LabelRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    order = find_order(order_id)
    courier = next((c for c in COURIERS if c["name"] == request.courier), None)
    if courier is None:
        raise HTTPException(status_code=400, detail="Unknown courier")
    # Enforce cutoff for label creation.
    current = datetime.now(APP_TIMEZONE)
    h, m = map(int, courier["cutoff"].split(":"))
    cutoff = current.replace(hour=h, minute=m, second=0, microsecond=0)
    if ENFORCE_LABEL_CUTOFF and current >= cutoff:
        raise HTTPException(status_code=409, detail=f"{courier['name']} cutoff has passed")
    if order["status"] not in {"pending", "processing"} or order.get("scanned", 0) > 0:
        raise HTTPException(status_code=409, detail=f"{order_id} can no longer be re-labelled (status: {order['status']})")
    undo = create_undo(user, f"Create {courier['name']} label for {order_id}")
    order["status"] = "processing"
    order["courier"] = courier["name"]
    touch_order(order)
    order["courierCost"] = float(courier["cost"])
    order["labelCreatedAt"] = iso(now_utc())
    add_activity("label", f"Label created with {courier['name']} for {order_id}", user["name"], order_id)
    persist_and_state()
    return {"order": order, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/orders/{order_id}/tracking")
def update_tracking(order_id: str, request: TrackingRequest, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    order = find_order(order_id)
    parsed = urlparse(request.trackingLink.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Tracking link must be a valid http(s) URL")
    undo = create_undo(user, f"Update tracking link for {order_id}")
    link = request.trackingLink.strip()
    order["trackingLink"] = link
    order["trackingAddedAt"] = iso(now_utc())
    touch_order(order)
    for box in store.state.get("boxes", []):
        if box.get("orderId") == order_id:
            box["trackingLink"] = link
            box["trackingAddedAt"] = iso(now_utc())
            box["updatedAt"] = iso(now_utc())
    add_activity("tracking", f"Added tracking link for {order_id}", user["name"], order_id)
    persist_and_state()
    return {"order": order, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/orders/batch-stage")
def batch_stage(request: BatchRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    changed = 0
    eligible_ids = [oid for oid in request.orderIds if find_order(oid)["status"] == "packed"]
    undo = create_undo(user, f"Move {len(eligible_ids)} order(s) to staging") if eligible_ids else None
    for oid in request.orderIds:
        o = find_order(oid)
        if o["status"] == "packed":
            o["status"] = "staged"
            touch_order(o)
            add_staged_box(o, user["name"])
            changed += 1
    add_activity("seal", f"Batch moved {changed} packed orders to staging", user["name"])
    persist_and_state()
    return {"changed": changed, "state": deepcopy(store.state), "undo": undo_detail(undo) if undo else None}


@app.post("/api/orders/batch-print")
def batch_print(request: BatchRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    undo = create_undo(user, f"Queue {len(request.orderIds)} label(s) for printing")
    add_activity("issue", f"Queued {len(request.orderIds)} labels for print", user["name"])
    persist_and_state()
    return {"queued": len(request.orderIds), "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/print/labels")
def print_labels(request: BatchRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    valid_ids = []
    for order_id in request.orderIds[:200]:
        try:
            find_order(order_id)
            valid_ids.append(order_id)
        except HTTPException:
            continue
    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid orders selected for printing")
    # Capture undo state BEFORE the print markers and job history are written.
    undo = create_undo(user, f"Print {len(valid_ids)} label(s)")
    selected = []
    printed = iso(now_utc())
    for order_id in valid_ids:
        order = find_order(order_id)
        order["printedAt"] = printed
        touch_order(order)
        selected.append({
            "orderId": order["id"], "customer": order["customer"], "address": order["shippingAddress"],
            "product": order["product"], "variant": order["variant"], "quantity": order["quantity"],
            "courier": order.get("courier") or "Unassigned", "trackingId": order.get("trackingId"),
            "trackingLink": order.get("trackingLink"),
        })
    job_id = f"PRN-{int(now_utc().timestamp() * 1000)}"
    store.state.setdefault("printJobs", []).insert(0, {"id": job_id, "createdAt": iso(now_utc()), "createdBy": user["name"], "count": len(selected), "orderIds": [x["orderId"] for x in selected]})
    add_activity("print", f"Prepared {len(selected)} label(s) for printing", user["name"])
    persist_and_state()
    return {"jobId": job_id, "labels": selected, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/orders/{order_id}/scan")
def scan_order(order_id: str, request: ScanRequest, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    if request.orderId != order_id:
        raise HTTPException(status_code=400, detail="Order mismatch")
    order = find_order(order_id)
    if request.barcode != order["barcode"]:
        undo = create_undo(user, f"Record mis-scan for {order_id}")
        add_activity("scan_error", f"Wrong barcode rejected for {order_id}", user["name"], order_id)
        persist_and_state()
        raise HTTPException(status_code=409, detail={"message": "Wrong barcode", "undo": undo_detail(undo)})
    if order["status"] not in {"processing"} or not order.get("courier"):
        raise HTTPException(status_code=409, detail="Create a label before picking this order")
    inventory = find_inventory(order["sku"])
    if inventory["quantity"] < 1:
        raise HTTPException(status_code=409, detail="No main-warehouse stock available")
    if order.get("scanned", 0) >= order["quantity"]:
        raise HTTPException(status_code=409, detail="All units already scanned")
    undo = create_undo(user, f"Scan unit for {order_id}")
    inventory["quantity"] -= 1
    inventory["lastUpdated"] = iso(now_utc())
    order["scanned"] = order.get("scanned", 0) + 1
    order["status"] = "processing"
    touch_order(order)
    add_activity("pick", f"Picked {order['product']} ({order['scanned']}/{order['quantity']})", user["name"], order_id)
    persist_and_state()
    return {"ok": True, "order": order, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/orders/{order_id}/seal")
def seal_order(order_id: str, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    order = find_order(order_id)
    if order["status"] in {"staged", "shipped"}:
        raise HTTPException(status_code=409, detail=f"{order_id} is already {order['status']}")
    if order.get("scanned", 0) < order["quantity"]:
        raise HTTPException(status_code=409, detail="Every unit must be scanned before sealing")
    undo = create_undo(user, f"Seal {order_id} and stage box")
    order["status"] = "packed"
    touch_order(order)
    add_staged_box(order, user["name"])
    order["status"] = "staged"
    add_activity("seal", f"Sealed box for {order_id}", user["name"], order_id)
    persist_and_state()
    return {"order": order, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/inventory/transfer")
def transfer(request: TransferRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    item = find_inventory(request.sku)
    if request.quantity > item.get("wh2Quantity", 0):
        raise HTTPException(status_code=409, detail="Warehouse 2 does not have enough stock")
    undo = create_undo(user, f"Transfer {request.quantity} × {request.sku} to Main")
    item["wh2Quantity"] -= request.quantity
    item["quantity"] += request.quantity
    item["lastUpdated"] = iso(now_utc())
    add_activity("transfer", f"Transferred {request.quantity} × {request.sku} from Warehouse 2 to Main", user["name"])
    persist_and_state()
    return {"item": item, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/inventory/audit")
def audit(request: AuditRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    item = find_inventory(request.sku)
    old = item["quantity"]
    undo = create_undo(user, f"Audit {request.sku}")
    item["quantity"] = request.counted
    item["lastUpdated"] = iso(now_utc())
    add_activity("audit", f"{request.sku} cycle count {old} → {request.counted}", user["name"])
    persist_and_state()
    return {"item": item, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/receiving/receive")
def receive(request: ReceiveRequest, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    rec = next((x for x in store.state["receiving"] if x["id"] == request.id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Inbound delivery not found")

    lines = rec.get("items") or [{
        "sku": rec.get("sku"), "product": rec.get("product"), "variant": "",
        "expectedQty": rec.get("expectedQty", 0), "receivedQty": rec.get("receivedQty", 0)
    }]
    target_sku = request.sku or next((x.get("sku") for x in lines if x.get("expectedQty", 0) > x.get("receivedQty", 0)), rec.get("sku"))
    line = next((x for x in lines if x.get("sku") == target_sku), None)
    if not line:
        raise HTTPException(status_code=404, detail="Inbound line item not found")
    remaining_line = max(0, int(line.get("expectedQty", 0)) - int(line.get("receivedQty", 0)))
    if request.quantity > remaining_line:
        raise HTTPException(status_code=409, detail=f"Only {remaining_line} units remain for {target_sku}")

    undo = create_undo(user, f"Receive {request.quantity} units for {request.id} · {target_sku}")
    line["receivedQty"] = int(line.get("receivedQty", 0)) + request.quantity
    rec["items"] = lines
    rec["expectedQty"] = sum(int(x.get("expectedQty", 0)) for x in lines)
    rec["receivedQty"] = sum(int(x.get("receivedQty", 0)) for x in lines)
    rec["status"] = "received" if rec["receivedQty"] >= rec["expectedQty"] else "receiving"
    now = iso(now_utc())
    rec["receivedAt"] = now
    rec["updatedAt"] = now

    item = find_inventory(target_sku)
    if rec.get("warehouse") == "WH2":
        item["wh2Quantity"] = item.get("wh2Quantity", 0) + request.quantity
    else:
        item["quantity"] += request.quantity
    item["lastUpdated"] = now
    add_activity("receive", f"Received {request.quantity} × {line.get('product', target_sku)} into {rec['warehouse']}", user["name"])
    persist_and_state()
    return {"receiving": rec, "item": item, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/staging/assign")
def stage_assign(request: StageAssignRequest, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    box = next((b for b in store.state["boxes"] if b["id"] == request.boxId), None)
    bay = next((b for b in store.state["bays"] if b["id"] == request.bayId), None)
    if not box or not bay:
        raise HTTPException(status_code=404, detail="Box or bay not found")
    if len(bay["boxIds"]) >= bay["capacity"] and request.boxId not in bay["boxIds"]:
        raise HTTPException(status_code=409, detail="Bay at capacity")
    undo = create_undo(user, f"Assign {request.boxId} to {request.bayId}")
    for b in store.state["bays"]:
        if request.boxId in b["boxIds"]:
            b["boxIds"].remove(request.boxId)
    if request.boxId not in bay["boxIds"]:
        bay["boxIds"].append(request.boxId)
    box["location"] = bay["id"]
    box["scannedIn"] = False
    box["updatedAt"] = iso(now_utc())
    order = find_order(box["orderId"])
    order["bay"] = bay["id"]
    touch_order(order)
    add_activity("seal", f"Assigned {request.boxId} to {bay['id']}", user["name"], box["orderId"])
    persist_and_state()
    return {"box": box, "bay": bay, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/staging/scan")
def stage_scan(request: StageScanRequest, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    box = next((b for b in store.state["boxes"] if b["id"] == request.boxId), None)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    if request.bayId:
        # Reuse assignment semantics, then mark scanned-in.
        bay = next((b for b in store.state["bays"] if b["id"] == request.bayId), None)
        if not bay:
            raise HTTPException(status_code=404, detail="Bay not found")
    undo = create_undo(user, f"Scan {request.boxId} into staging")
    if request.bayId:
        # Reuse assignment semantics, then mark scanned-in.
        for b in store.state["bays"]:
            if box["id"] in b["boxIds"]:
                b["boxIds"].remove(box["id"])
        if box["id"] not in bay["boxIds"]:
            bay["boxIds"].append(box["id"])
        box["location"] = bay["id"]
    box["scannedIn"] = True
    box["updatedAt"] = iso(now_utc())
    try:
        touch_order(find_order(box["orderId"]))
    except HTTPException:
        pass
    add_activity("seal", f"Scanned {box['id']} into {box['location']}", user["name"], box["orderId"])
    persist_and_state()
    return {"box": box, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/staging/handover")
def handover(request: HandoverRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    candidates = [b for b in store.state["boxes"] if b["courier"] == request.courier and b["status"] in {"waiting_pickup", "missed"}]
    unscanned = [b for b in candidates if b.get("scannedIn") is False]
    ready = [b for b in candidates if b.get("scannedIn") is not False]
    if unscanned and not ready:
        raise HTTPException(status_code=409, detail=f"{len(unscanned)} box(es) are not scanned into staging")
    if not ready:
        raise HTTPException(status_code=409, detail="No staged boxes ready for this courier")
    undo = create_undo(user, f"Handover {len(ready)} box(es) to {request.courier}")
    picked_at = iso(now_utc())
    for box in ready:
        box["status"] = "picked_up"
        box["trackingId"] = f"TRK-{secrets.randbelow(900000000) + 100000000}"
        box["pickedUpAt"] = picked_at
        box["updatedAt"] = picked_at
        box["location"] = "Picked Up"
        for bay in store.state.get("bays", []):
            if box["id"] in bay.get("boxIds", []):
                bay["boxIds"].remove(box["id"])
        order = find_order(box["orderId"])
        order["status"] = "shipped"
        order["trackingId"] = box["trackingId"]
        if order.get("trackingLink"):
            box["trackingLink"] = order["trackingLink"]
        touch_order(order)
    add_activity("handover", f"Handover signed for {request.courier} by {request.signedBy}: {len(ready)} boxes", user["name"])
    persist_and_state()
    return {"shipped": len(ready), "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/issues")
def create_issue(request: IssueCreate, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    if request.severity not in ISSUE_SEVERITIES:
        raise HTTPException(status_code=422, detail=f"severity must be one of {sorted(ISSUE_SEVERITIES)}")
    if request.category not in ISSUE_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"category must be one of {sorted(ISSUE_CATEGORIES)}")
    if request.orderId and not any(o["id"] == request.orderId for o in store.state["orders"]):
        raise HTTPException(status_code=404, detail="Order not found for this incident")
    undo = create_undo(user, f"Log incident: {request.title}")
    issue = {
        "id": f"ISS-{int(now_utc().timestamp() * 1000)}", "title": request.title,
        "description": request.description, "severity": request.severity, "category": request.category,
        "status": "open", "reportedAt": iso(now_utc()), "reportedBy": user["name"],
        "aiSuggestion": "Review the order, owner and operational logs; resolve before SLA impact.", "orderId": request.orderId,
    }
    store.state["issues"].insert(0, issue)
    add_activity("issue", f"Logged incident: {request.title}", user["name"], request.orderId)
    persist_and_state()
    return {"issue": issue, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.patch("/api/issues/{issue_id}")
def update_issue(issue_id: str, request: IssueStatusRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    issue = next((x for x in store.state["issues"] if x["id"] == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if request.status not in {"open", "investigating", "resolved"}:
        raise HTTPException(status_code=400, detail="Invalid issue status")
    undo = create_undo(user, f"Update {issue_id} to {request.status}")
    issue["status"] = request.status
    if request.status == "resolved":
        issue["resolvedAt"] = iso(now_utc())
    add_activity("issue", f"Updated {issue_id} to {request.status}", user["name"])
    persist_and_state()
    return {"issue": issue, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/inventory/import")
def import_inventory(request: InventoryImportRequest, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    undo = create_undo(user, "Import inventory CSV")
    updated = 0
    for row in request.items:
        sku = str(row.get("sku", "")).strip()
        if not sku:
            continue
        item = next((x for x in store.state["inventory"] if x["sku"] == sku), None)
        if not item:
            continue
        if "quantity" in row and str(row["quantity"]).strip() != "":
            item["quantity"] = max(0, int(float(row["quantity"])))
        if "location" in row and str(row["location"]).strip():
            item["location"] = str(row["location"]).strip()
        item["lastUpdated"] = iso(now_utc())
        updated += 1
    add_activity("audit", f"Imported inventory CSV ({updated} SKUs updated)", user["name"])
    persist_and_state()
    return {"updated": updated, "state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/reset")
def reset_demo(user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    undo = create_undo(user, "Reset PulseOps demo data")
    store.reset()
    add_activity("issue", "Reset demo data", user["name"])
    store.persist()
    return {"state": deepcopy(store.state), "undo": undo_detail(undo)}


@app.post("/api/undo/{undo_id}")
def undo_mutation(undo_id: str, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    bucket = store.undo_history.get(user["email"], [])
    if not bucket:
        raise HTTPException(status_code=404, detail="No undo action available")
    record = bucket[-1]
    if record["id"] != undo_id:
        raise HTTPException(status_code=409, detail="Only the most recent action can be undone")
    store.state = deepcopy(record["state"])
    bucket.pop()
    add_activity("undo", f"Undid: {record["label"]}", user["name"])
    store.persist()
    return {"ok": True, "undone": record["label"], "state": deepcopy(store.state), "undo": None}


@app.post("/api/inventory/{sku}/verify")
def verify_inventory(
    sku: str,
    counted: int = Form(..., ge=0),
    notes: str = Form(default=""),
    photo: UploadFile | None = File(default=None),
    user: dict[str, str] = Depends(admin_only),
) -> dict[str, Any]:
    item = find_inventory(sku)
    photo_url = item.get("verificationPhotoUrl")
    content = None
    ext = "jpg"
    if photo is not None:
        if not (photo.content_type or "").startswith("image/"):
            raise HTTPException(status_code=400, detail="Verification photo must be an image")
        content = photo.file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Verification photo must be 5 MB or smaller")
        ext = (photo.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
        if ext not in {"jpg", "jpeg", "png", "webp", "heic"}:
            ext = "jpg"
    undo = create_undo(user, f"Verify inventory {sku}")
    if content is not None:
        filename = f"{sku.replace('/', '-')}-{int(now_utc().timestamp() * 1000)}.{ext}"
        target = MEDIA_DIR / filename
        target.write_bytes(content)
        photo_url = f"/media/inventory_verification/{filename}"
    old = item["quantity"]
    item["quantity"] = counted
    item["verificationStatus"] = "verified"
    item["verifiedAt"] = iso(now_utc())
    item["verifiedBy"] = user["name"]
    item["verificationPhotoUrl"] = photo_url
    item["verificationNotes"] = notes.strip() or None
    item["lastUpdated"] = iso(now_utc())
    add_activity("verify", f"Verified {sku}: {old} → {counted}" + (" with shelf photo" if photo is not None else ""), user["name"])
    persist_and_state()
    return {"item": item, "state": deepcopy(store.state), "undo": undo_detail(undo)}


def rows_to_csv(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return ""
    keys = sorted({k for row in rows for k in row.keys()})
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=keys)
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()


@app.get("/api/export/{dataset}")
def export_dataset(dataset: str, user: dict[str, str] = Depends(admin_only)) -> StreamingResponse:
    mapping = {"orders": store.state["orders"], "inventory": store.state["inventory"], "issues": store.state["issues"], "boxes": store.state["boxes"]}
    if dataset not in mapping:
        raise HTTPException(status_code=404, detail="Unknown dataset")
    content = rows_to_csv(mapping[dataset]).encode("utf-8")
    return StreamingResponse(io.BytesIO(content), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{dataset}.csv"'})


@app.get("/api/workers/{worker_id}/shift-report")
def worker_shift_report(worker_id: str, user: dict[str, str] = Depends(admin_only)) -> dict[str, Any]:
    worker = next((w for w in store.state.get("workers", []) if w.get("id") == worker_id), None)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    mine = [a for a in store.state.get("activity", []) if a.get("workerId") == worker_id or a.get("actor") == worker.get("name")]
    stats = {
        "unitsPicked": sum(1 for a in mine if a.get("type") == "pick"),
        "misScans": sum(1 for a in mine if a.get("type") == "scan_error"),
        "boxesSealed": sum(1 for a in mine if a.get("type") == "seal"),
        "ordersHandled": len({a.get("orderId") for a in mine if a.get("orderId")}),
    }
    return {"worker": deepcopy(worker), "stats": stats, "activity": deepcopy(mine[:250])}


@app.get("/api/shift-report")
def shift_report(user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    mine = [a for a in store.state["activity"] if a["actor"] == user["name"]]
    stats = {
        "unitsPicked": sum(1 for a in mine if a["type"] == "pick"),
        "misScans": sum(1 for a in mine if a["type"] == "scan_error"),
        "boxesSealed": sum(1 for a in mine if a["type"] == "seal"),
        "ordersHandled": len({a.get("orderId") for a in mine if a.get("orderId")}),
    }
    return {"stats": stats, "activity": mine[:50]}


@app.get("/api/docs-note")
def docs_note() -> dict[str, str]:
    return {"message": "See /docs for the interactive FastAPI contract."}



# ---------------------------------------------------------------------------
# Command Center: decision-support analytics (cutoff radar, smart pick wave,
# stock shortfall forecast, next-best-action queue).
# Ideas based on carrier-cutoff-aligned wave picking, batch picking (shared SKU
# stops) and demand-vs-stock coverage checks used in modern WMS tools.
# ---------------------------------------------------------------------------
def _cutoff_today(hhmm: str) -> datetime:
    h, m = [int(x) for x in hhmm.split(":")]
    local = now_utc().astimezone(APP_TIMEZONE).replace(hour=h, minute=m, second=0, microsecond=0)
    return local.astimezone(timezone.utc)


def _aisle_key(location: str) -> tuple[int, str]:
    try:
        aisle = int(location.split("Aisle")[1].split("·")[0].strip())
    except Exception:
        aisle = 99
    return aisle, location


def build_cutoff_radar(minutes_per_order: float, team: int) -> list[dict[str, Any]]:
    state = store.state
    rows = []
    for c in state["couriers"]:
        mine = [o for o in state["orders"] if o.get("courier") == c["name"]]
        not_ready = [o for o in mine if o["status"] in {"processing", "packed"}]
        staged = [o for o in mine if o["status"] == "staged"]
        minutes_left = round((_cutoff_today(c["cutoff"]) - now_utc()).total_seconds() / 60)
        work_min = round(len(not_ready) * minutes_per_order / max(team, 1), 1)
        if not not_ready:
            risk = "clear"
        elif minutes_left < 0:
            risk = "missed"
        elif work_min > minutes_left:
            risk = "will_miss"
        elif work_min > 0.7 * minutes_left:
            risk = "at_risk"
        else:
            risk = "on_track"
        needs_team = None
        if not_ready and minutes_left > 0:
            needs_team = max(1, -(-int(len(not_ready) * minutes_per_order) // max(minutes_left, 1)))
        rows.append({"courier": c["name"], "cutoff": c["cutoff"], "pickup": c["pickup"], "minutesLeft": minutes_left,
                     "notReady": len(not_ready), "staged": len(staged), "workMinutes": work_min,
                     "teamNeeded": needs_team, "risk": risk,
                     "priorityNotReady": len([o for o in not_ready if o["priority"] == "priority"])})
    order = {"missed": 0, "will_miss": 1, "at_risk": 2, "on_track": 3, "clear": 4}
    return sorted(rows, key=lambda r: (order[r["risk"]], r["minutesLeft"]))


def build_pick_wave(size: int) -> dict[str, Any]:
    state = store.state
    cutoff = {c["name"]: _cutoff_today(c["cutoff"]) for c in state["couriers"]}
    pool = [o for o in state["orders"] if o["status"] == "processing" and o.get("courier") and o["scanned"] < o["quantity"]]
    pool.sort(key=lambda o: (o["priority"] != "priority", cutoff.get(o["courier"], now_utc() + timedelta(days=1)), o["deadline"]))
    chosen = pool[: max(1, min(size, 40))]
    inv = {i["sku"]: i for i in state["inventory"]}
    lines: dict[str, dict[str, Any]] = {}
    for o in chosen:
        item = inv.get(o["sku"], {})
        line = lines.setdefault(o["sku"], {"sku": o["sku"], "product": o["product"], "variant": o["variant"],
                                           "barcode": o["barcode"], "location": item.get("location", "Unassigned"),
                                           "qty": 0, "orders": [], "mainStock": item.get("quantity", 0), "shortBy": 0})
        line["qty"] += o["quantity"] - o["scanned"]
        line["orders"].append(o["id"])
    route = sorted(lines.values(), key=lambda l: _aisle_key(l["location"]))
    for stop in route:
        stop["shortBy"] = max(0, stop["qty"] - stop["mainStock"])
    discrete_stops = len(chosen)
    batch_stops = len(route)
    return {"orders": [{"id": o["id"], "priority": o["priority"], "courier": o["courier"], "deadline": o["deadline"],
                        "units": o["quantity"] - o["scanned"]} for o in chosen],
            "route": route, "totalUnits": sum(l["qty"] for l in route),
            "stopsSaved": discrete_stops - batch_stops,
            "travelSavingPct": round((1 - batch_stops / discrete_stops) * 100) if discrete_stops else 0,
            "poolSize": len(pool), "blockedByStock": [l["sku"] for l in route if l["shortBy"] > 0]}


def build_stock_forecast() -> list[dict[str, Any]]:
    state = store.state
    demand: dict[str, int] = {}
    for o in state["orders"]:
        if o["status"] in {"pending", "processing"}:
            demand[o["sku"]] = demand.get(o["sku"], 0) + max(0, o["quantity"] - o["scanned"])
    inbound: dict[str, int] = {}
    for r in state["receiving"]:
        if r["status"] == "pending":
            inbound[r["sku"]] = inbound.get(r["sku"], 0) + r["expectedQty"]
    out = []
    for i in state["inventory"]:
        d = demand.get(i["sku"], 0)
        main, wh2 = i["quantity"], i.get("wh2Quantity", 0)
        shortfall = max(0, d - main)
        if shortfall and wh2 >= shortfall:
            action, level = f"Transfer {shortfall} from Warehouse 2", "act_now"
        elif shortfall:
            action, level = f"Transfer {wh2} from WH2 and reorder {shortfall - wh2}", "critical"
        elif main <= i["reorderPoint"] and wh2 > 0:
            action, level = f"Below reorder point: transfer {min(wh2, i['reorderPoint'] * 2 - main)} from WH2", "watch"
        elif main <= i["reorderPoint"]:
            action, level = "Below reorder point: raise purchase order", "critical"
        else:
            action, level = "Healthy", "ok"
        out.append({"sku": i["sku"], "product": i["name"], "variant": i["variant"], "mainQty": main, "wh2Qty": wh2,
                    "openDemand": d, "shortfall": shortfall, "inbound": inbound.get(i["sku"], 0),
                    "coverPct": round(min(main / d, 9.99) * 100) if d else None, "level": level, "action": action})
    rank = {"critical": 0, "act_now": 1, "watch": 2, "ok": 3}
    return sorted(out, key=lambda r: (rank[r["level"]], -r["shortfall"]))


@app.get("/api/insights")
def insights(minutes_per_order: float = 3.0, team: int = 3, wave_size: int = 12,
             user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    minutes_per_order = max(0.5, min(minutes_per_order, 30))
    team = max(1, min(team, 20))
    state = store.state
    radar = build_cutoff_radar(minutes_per_order, team)
    wave = build_pick_wave(wave_size)
    forecast = build_stock_forecast()
    now = now_utc()
    open_orders = [o for o in state["orders"] if o["status"] != "shipped"]
    overdue = [o for o in open_orders if datetime.fromisoformat(o["deadline"]) < now]
    prio_risk = [o for o in open_orders if o["priority"] == "priority" and datetime.fromisoformat(o["deadline"]) < now + timedelta(minutes=60)]
    scans = [a for a in state["activity"] if a["type"] == "scan_error"]
    actions: list[dict[str, Any]] = []
    for r in radar:
        if r["risk"] in {"missed", "will_miss", "at_risk"}:
            sev = "critical" if r["risk"] in {"missed", "will_miss"} else "warning"
            msg = (f"{r['courier']} cutoff {r['cutoff']} has passed with {r['notReady']} orders not staged - reschedule pickup or switch courier"
                   if r["risk"] == "missed" else
                   f"{r['courier']} cutoff in {r['minutesLeft']} min: {r['notReady']} orders still to pack"
                   f" (needs ~{r['workMinutes']} min, add packers to reach {r['teamNeeded']})")
            actions.append({"severity": sev, "type": "cutoff", "title": msg, "target": "worker"})
    if prio_risk:
        actions.append({"severity": "critical", "type": "priority",
                        "title": f"{len(prio_risk)} priority orders are overdue or due within 60 min - pull them into the next wave",
                        "target": "orders"})
    for f in forecast:
        if f["level"] in {"critical", "act_now"}:
            actions.append({"severity": "critical" if f["level"] == "critical" else "warning", "type": "stock",
                            "title": f"{f['product']} ({f['variant']}): open demand {f['openDemand']} vs {f['mainQty']} on shelf. {f['action']}",
                            "target": "inventory"})
    if wave["blockedByStock"]:
        actions.append({"severity": "warning", "type": "wave",
                        "title": f"Next pick wave is blocked by stock on {len(wave['blockedByStock'])} SKUs - transfer before releasing",
                        "target": "inventory"})
    actions.sort(key=lambda a: 0 if a["severity"] == "critical" else 1)
    return {"generatedAt": iso(now), "assumptions": {"minutesPerOrder": minutes_per_order, "team": team},
            "kpis": {"openOrders": len(open_orders), "overdue": len(overdue),
                     "overduePct": round(len(overdue) / len(open_orders) * 100) if open_orders else 0,
                     "priorityAtRisk": len(prio_risk), "misScans": len(scans),
                     "stockActions": len([f for f in forecast if f["level"] in {"critical", "act_now"}]),
                     "waveStopsSaved": wave["stopsSaved"], "waveSavingPct": wave["travelSavingPct"]},
            "radar": radar, "wave": wave, "forecast": forecast, "actions": actions[:12]}



@app.get("/api/briefing")
def shift_briefing(team: int = 3, minutes_per_order: float = 3.0, user: dict[str, str] = Depends(get_current_user)) -> dict[str, Any]:
    """Plain-English start-of-shift briefing generated from live data (rule-based, no external AI)."""
    data = insights(minutes_per_order=minutes_per_order, team=team, wave_size=12, user=user)
    k, radar, wave = data["kpis"], data["radar"], data["wave"]
    hour = datetime.now(APP_TIMEZONE).hour
    greeting = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
    lines = [f"{greeting}, {user['name'].split()[0]}. There are {k['openOrders']} open orders; {k['overdue']} are past their deadline ({k['overduePct']}%)."]
    if k["priorityAtRisk"]:
        lines.append(f"{k['priorityAtRisk']} priority orders are overdue or due within the hour. Start there.")
    urgent = [r for r in radar if r["risk"] in {"missed", "will_miss", "at_risk"}]
    if urgent:
        r = urgent[0]
        lines.append(f"First cutoff to watch: {r['courier']} at {r['cutoff']} ({r['notReady']} orders still to pack"
                     + (f", needs about {r['teamNeeded']} packers" if r["teamNeeded"] else "") + ").")
    else:
        lines.append("Every courier cutoff is on track at the current pace.")
    if wave["route"]:
        lines.append(f"Release the next pick wave: {len(wave['orders'])} orders, {wave['totalUnits']} units, {len(wave['route'])} shelf stops"
                     + (f" ({wave['stopsSaved']} saved by batching)." if wave["stopsSaved"] else "."))
    if wave["blockedByStock"]:
        lines.append(f"Transfer stock first: {len(wave['blockedByStock'])} SKUs in that wave are short on the main shelf.")
    elif k["stockActions"]:
        lines.append(f"{k['stockActions']} SKUs need a warehouse-2 transfer or reorder today.")
    return {"generatedAt": data["generatedAt"], "lines": lines, "headline": lines[0]}


@app.get("/api/briefing/overdue-suggestions")
def overdue_order_suggestions(
    team: int = 3,
    minutes_per_order: float = 3.0,
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, Any]:
    """Build a rule-based overdue recovery plan from current orders and operational risks."""
    data = insights(minutes_per_order=minutes_per_order, team=team, wave_size=12, user=user)
    now = now_utc()
    overdue = [
        order for order in store.state["orders"]
        if order["status"] != "shipped" and datetime.fromisoformat(order["deadline"]) < now
    ]
    overdue.sort(key=lambda order: datetime.fromisoformat(order["deadline"]))
    priority_count = sum(order["priority"] == "priority" for order in overdue)
    open_orders = [
        order for order in store.state["orders"]
        if order["status"] != "shipped"
    ]
    open_orders.sort(key=lambda order: datetime.fromisoformat(order["deadline"]))
    if overdue:
        if priority_count:
            queue_action = f"Start with the {priority_count} overdue priority {'order' if priority_count == 1 else 'orders'}, then work through the rest by earliest deadline."
        else:
            queue_action = f"Work the {len(overdue)} overdue orders by earliest deadline, keeping priority orders ahead of standard work."
        oldest = datetime.fromisoformat(overdue[0]["deadline"])
        overdue_minutes = max(1, int((now - oldest).total_seconds() // 60))
        aging_action = f"The oldest open order is at least {overdue_minutes} minutes late. Check its stock and packing status, then batch it into the next pick run."
    elif open_orders:
        next_order = open_orders[0]
        minutes_until_due = max(0, int((datetime.fromisoformat(next_order["deadline"]) - now).total_seconds() // 60))
        queue_action = f"No open orders are overdue. Keep the queue moving by deadline; {next_order['id']} is next due in about {minutes_until_due} minutes."
        aging_action = "Prevent a new backlog: review any order that has not moved to picking and clear it before the next courier cutoff."
    else:
        queue_action = "There are no open orders. Confirm the next import and keep the pack team available for the next incoming wave."
        aging_action = "Use the clear queue to reconcile staged parcels and resolve any outstanding handover exceptions."

    urgent_cutoffs = [row for row in data["radar"] if row["risk"] in {"missed", "will_miss", "at_risk"}]
    if urgent_cutoffs:
        cutoff = urgent_cutoffs[0]
        if cutoff["risk"] == "missed":
            cutoff_action = f"{cutoff['courier']}'s {cutoff['cutoff']} cutoff has passed with {cutoff['notReady']} orders not staged. Contact the courier or move eligible orders to the next pickup."
        else:
            extra_packers = max(0, (cutoff["teamNeeded"] or team) - team)
            staffing = f" Add {extra_packers} packers if available." if extra_packers else ""
            cutoff_action = f"Protect {cutoff['courier']}'s {cutoff['cutoff']} cutoff: {cutoff['notReady']} orders remain and need about {cutoff['workMinutes']} minutes to pack.{staffing}"
    else:
        next_cutoff = next((row for row in data["radar"] if row["notReady"]), None)
        cutoff_action = (
            f"{next_cutoff['courier']} is the next active courier queue. Keep its {next_cutoff['notReady']} orders moving before the {next_cutoff['cutoff']} cutoff."
            if next_cutoff else
            "Courier queues are clear. Keep staged parcels grouped by carrier so the next handover stays quick."
        )

    blocked = data["wave"]["blockedByStock"]
    stock_risks = [item for item in data["forecast"] if item["level"] in {"critical", "act_now"}]
    if blocked:
        stock_action = f"Resolve the {len(blocked)} SKU stock shortage(s) in the next pick wave before releasing it."
    elif stock_risks:
        item = stock_risks[0]
        stock_action = f"Check {item['product']} ({item['variant']}): {item['openDemand']} units of open demand versus {item['mainQty']} on the main shelf. {item['action']}"
    elif data["wave"]["orders"]:
        stock_action = f"Release the next pick wave of {len(data['wave']['orders'])} orders and {data['wave']['totalUnits']} units; batching saves {data['wave']['stopsSaved']} shelf stops."
    else:
        stock_action = "No stock or pick-wave blocker is detected. Do a quick exception-log check, then keep the current pace."

    suggestions = [queue_action, aging_action, cutoff_action, stock_action]
    return {"generatedAt": data["generatedAt"], "overdueCount": len(overdue), "suggestions": suggestions}


@app.get("/", include_in_schema=False)
def frontend_index() -> FileResponse:
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return FileResponse(Path(__file__).parent / "README.md", media_type="text/markdown")


@app.get("/{path:path}", include_in_schema=False)
def frontend_spa(path: str) -> FileResponse:
    # Client-side routes such as /orders and /worker resolve to the SPA shell.
    if path.startswith("api/") or path.startswith("media/"):
        raise HTTPException(status_code=404, detail="Not found")
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found")
    return FileResponse(index_file)
