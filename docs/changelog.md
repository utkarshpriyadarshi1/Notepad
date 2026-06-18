# Changelog

All notable changes to the **Notepad** project will be documented in this file.

## [1.0.3] - 2026-06-18
### Added
- Flat merge of `origin/notepad` into `master` branch under decoupled `/frontend` and `/backend` repository layout.
- Auto-open main dashboard (`main_notepad`) centered and expanded at `1000x650` footprint on app startup.
- Consolidated SQLite database migrations up to schema `LATEST_SCHEMA_VERSION = 10` supporting `sticky_notes`, `events_log`, `expense_log`, and `vcs_commits` tables.
- Persist always-on-top (pin) state of notes to SQLite database under a new `is_pinned` column inside the `sticky_notes` table.
- Automatically open all saved pinned notes in separate sticky note windows on app startup.
- Dynamic help file reading and logs diagnostic parsing channels.

### Changed
- Upgraded project dependencies and devDependencies to their latest stable releases (React 19, Vite 8, Electron 42, marked 18, etc.).
- Switched Widgets tab pin styling to render from persistent database state.
- Ensured settings sidebar toggles open by default on the main dashboard (`main_notepad`) window.

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
