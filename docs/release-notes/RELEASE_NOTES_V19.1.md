# PulseOps V19.1 — Map Fix

- Fixed Leaflet map stacking so the map cannot cover the sticky application header/navigation.
- Added explicit map isolation and bounded Leaflet z-index layers.
- Added ResizeObserver-based `invalidateSize()` to keep tiles aligned with responsive card dimensions.
- Improved initial world-map centering.
