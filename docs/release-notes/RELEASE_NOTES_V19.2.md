# PulseOps V19.2 — Map / Header Fix

- Fixed the Leaflet map so its internal panes cannot overlay the PulseOps header/navigation.
- Added a dedicated map stacking context and containment boundary.
- Added responsive `ResizeObserver` invalidation so the map keeps the correct size when the dashboard grid changes.
- Default map view now fits the full operating world rather than opening centered on Europe/Asia.
- Preserved the known-good JSX Shell structure from V17.1 while retaining V19 navigation styling.
