# PulseOps V23 — Dark Mode Readability Fix

Fixed low-contrast/invisible text in dark mode, especially on Orders & Priority Kanban, table mode, form controls, muted metadata, and inherited labels.

Key fix: the application root uses both `dark` and `text-slate-900`; V23 corrects that inheritance and remaps the commonly used slate text/background utilities for dark mode.
