# Changelog

All notable changes to the **Smritipatra** project will be documented in this file.

## [1.0.1] - 2026-06-14
### Added
- Standardized Project Management Pattern configuration.
- Missing `heading` and `subtitle` fields to root `app.config.json`.
- Dynamic Help tab guidelines loaded via Electron IPC from `docs/help`.
- Code signing automation pipeline inside `builder` folder.
- Root wrappers (`build`, `clean`, `dev`, `setup`) for developer orchestration.

### Changed
- Relocated and renamed build/packaging scripts folder to `builder/`.
- Updated React Tab Navigation to be fully icon-only for a clean minimalist UI.
- Configured version bumping tool to execute automatically before production build runs.

### Removed
- Legacy unused `frontend/src/SettingPanel.jsx` component.
- Legacy unused default Vite template `frontend/src/AppDefault.jsx`.

## [1.0.0] - 2026-06-14
### Added
- Initial standalone offline sticky notes canvas widget release.
- Dual-mode widget views supporting interactive task checklists and Markdown editor.
- Offline relational SQLite local synchronization layer using SQL.js.
- Day/Night dark mode toggle.
- Full backup export/import features to portable JSON formats.
