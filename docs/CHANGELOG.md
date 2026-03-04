# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Documentation alignment pass:** Updated `docs/README.md`, `docs/APP_SUMMARY.md`, `docs/QUICK-START.md`, `docs/TROUBLESHOOTING.md`, and `docs/INDEX.md` to match current code behavior.
- **Runtime documentation corrections:** Clarified that desktop mode (`start.bat` / `npm run tauri:dev`) launches OPAL via Tauri, and removed references to non-existent helper scripts.
- **Command accuracy updates:** Replaced stale reset examples with Windows-friendly PowerShell commands and corrected current theme persistence key usage (`forge-theme-id`).
- **Context labels for proposal docs:** Added status notes to `DESIGN-SYSTEM.md` and `STABILITY-RECOMMENDATIONS.md` to distinguish roadmap guidance from implemented behavior.

### Removed
- **Docs consolidation:** Removed `docs/APP_SUMMARY.md`, `docs/INDEX.md`, `docs/DESIGN-SYSTEM.md`, and `docs/STABILITY-RECOMMENDATIONS.md` to keep a smaller, actively maintained docs set.

## [1.0.0] - 2026-02-26

### Added
- **Midnight Soft Theme**: Added new Unix-inspired dark theme as the default, featuring softer dark blue-grays (#1a1d26), gentle white text (#e8eaed), clear visual layers, and floating cards with shadows for improved comfort during long sessions.
- **Customizations Page Enhancements**: Added floating cards with elevation, larger rounded corners (`rounded-2xl`), enhanced color palette display, organized sections, and uppercase labels.
- **Design System Documentation**: Created comprehensive design system architecture in `DESIGN-SYSTEM.md`.

### Changed
- Made "Midnight Soft" the default theme over the previous pure black "Dark Minimal" theme.
- Improved visual hierarchy and contrast layers across the custom UI to prevent eye strain.

### Removed
- Deprecated earlier pure black aesthetics (`#080808` and `#0a0a0a`) from the default styling due to high contrast eye strain.
