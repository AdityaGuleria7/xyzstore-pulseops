# XYZStore · PulseOps — Operations User Guide

This build implements the supplied 17-page PulseOps guide and uses its terminology and workflow.

## Roles

**Admin** — dashboard, orders, courier/label creation, stock audits and Warehouse-2 transfers, staging/handover, receiving, problem log, shift report and CSV sync.

**Packer** — Worker Mode, barcode pick/pack, receiving and shift report. Admin-only stock transfer/audit controls are hidden from the packer workspace.

## Fulfillment flow

**Received → Processed → Picking → Packing → Staging → Shipped**

The dashboard derives the six-stage view from order status and scan progress.

## Main screens

### Operations Dashboard
Four headline KPIs, six-stage pipeline, deadline watchlist and operational widgets for staged boxes, inbound deliveries, transfers and priority orders.

### Orders & Priority Workflow
All 500 demo orders. Search by order/customer/SKU/variant, filter by stage/priority/courier, switch Table/Kanban, select rows for batch actions and flag issues.

### Create Label
Select a Received order. Compare Royal Mail, FedEx Ground, UPS Next Day and DHL Express by cost, ETA, cutoff and pickup time. Eligible services are shown separately from cutoff-passed services; the cheapest eligible option is marked **BEST VALUE**.

### Worker Mode
Priority orders are first. The active order shows shelf location and variant. Every unit must be scanned. Wrong barcodes are rejected and logged. Once all units are verified, **Seal box** creates a staged carton.

### Stock & Warehouse Transfers
Admin-only Main/WH2 inventory view with transfer actions for lines where Main stock is low and WH2 has stock.

### Couriers & Staging Bays
Six bays (B-01…B-06), pickup manifest, courier grouping, scan-in and handover checklist. Handover marks the courier's boxes as picked up and the associated orders as shipped.

### Receiving & Put-away
Inbound supplier deliveries show expected/received quantities and shelf location. Receiving adds units to inventory and records the activity.

### Daily Problem Log
Preset reasons: Missing Stock, Damaged Item, Address Error, Courier Missed. Issues have severity, owner, Open/Investigating/Resolved status and an actionable suggestion.

### Shift Report
Per-user totals for units picked, mis-scans, boxes sealed and orders handled, with activity timeline.

### CSV / Spreadsheet Sync
Export Orders, Inventory and Problem Log. Admin can bulk-import inventory using `sku`, `quantity`, and `location`.

## Demo credentials

- Admin: `admin@example.com` / `admin123`
- Packer: `packer@example.com` / `packer123`

## Persistence

Demo state is stored in browser localStorage. Use **Reset demo** to restore the supplied sample data.

## Build status
Typecheck and production build pass (`npm run typecheck`, `npm run build`). The shell now uses the guide's top-tab layout; the dashboard shows the four KPIs, six-stage pipeline, deadline watchlist and widgets.

## v3 changes
Orders & Priority now follows the reference screenshots: Table/Kanban toggle, search + stage/courier/order-type filters (All orders, Priority only, Flagged only), per-stage action buttons (Create Label, Pick in Worker, Seal box), Flag issue menu (Missing Stock, Damaged Item, Address Error, Courier Missed), and the Create Label courier comparison with BEST VALUE and "cutoff passed" tags. A dark-mode toggle is in the header.

## v4 changes
- **Couriers & Staging:** four courier cards (pickup time, speed, boxes ready), six staging bays with countdown badges, and a Handover Sign-off dialog with a "Signed by" field.
- **Problem Log:** issue cards with severity and a status dropdown (Open / Investigating / Resolved), Export, and a Log Incident dialog (Wrong Variant, Damaged Item, Courier Late, Barcode Unreadable, Discrepancy, Other).
- **Stock & Transfers:** Main / WH2 / Status ledger, "need a transfer" banner with Show only these, Transfer and Audit dialogs, and an Audit & Transfer Log panel. Audits and transfers are admin-only.
