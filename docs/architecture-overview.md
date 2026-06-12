# Architecture Overview

StickyFlow Desktop is an offline desktop widget utility application. It is architected as a decoupled system containing two primary modules:

## 1. Backend Layer (Electron Main Process)
The main process coordinates OS-level operations:
- Custom filesystem integration (`fsControllers.js`) to load and persist binary SQLite file streams to local user data directories.
- Background worker management (`serviceController.js`) simulating the local task execution statuses.
- Structured file logging (`logger.js`) detailing desktop application cycle parameters.
- Window management logic to position, size, cascade, and keep note widgets pinned above other windows.

## 2. Frontend Layer (React + Vite Client)
The renderer process displays the widget UI cards:
- Direct SQLite query execution via WASM-compiled `sql.js` driver within React hook operations (`useSqliteData.js`).
- State updates, theme presets, markdown formatting, and checklist task updates.
- IPC bindings invoking Electron window actions.
