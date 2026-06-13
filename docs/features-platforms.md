# Platform Compatibility and Feature Specifications

This document outlines the core capabilities, operating system compatibility, and design configurations of the **Smritipatra** application.

## 🖥️ Platform Compatibility Matrix

| Operating System | Support Level | Package Targets | Notes / Details |
| :--- | :--- | :--- | :--- |
| **Windows 10/11** | Fully Supported | NSIS Installer (.exe) | Supported with automatic code signing certificate setup scripts (`setup-cert.ps1`). |
| **macOS** | Fully Supported | DMG Installer (.dmg) | Requires standard Darwin compilation build flows. |
| **Linux (Ubuntu/Debian)** | Fully Supported | AppImage / deb | Complies using Electron Builder. |

---

## 🎨 Feature Specifications

### 1. Offline Sticky Notes Widget Canvas
- Multiple color themes (glass, white, black, yellow, pink, blue, green) configure individual note aesthetics.
- Custom resizing limits (defaults to `350x420` pixels).
- Pinned window behavior (optionally toggles `alwaysOnTop` flags to prevent clipping behind other windows).

### 2. Dual-Mode View Router
- **Tasks Checklist View**: Allows adding, renaming, deleting, and checking off interactive checkboxed items.
- **Markdown Editor View**: Implements raw text inputs, full Markdown syntax formatting toolbar, and real-time styled previews.

### 3. Folder & Widget Categorization
- Create, rename, and delete custom notebooks/folders.
- Group and nest multiple sticky note widgets within designated folder scopes.

### 4. Database Engine (SQLite & SQL.js)
- All records are saved locally in a virtual SQLite database stream.
- Supports **International Language Input** natively through full UTF-8 database encoding.
- Auto-migrates database versions safely on application startup.

### 5. Export/Import Backups
- Backup individual checklists or full notebooks as structured JSON schemas.
- Re-import JSON datasets to restore database state across desktop platforms.

### 6. Process Monitoring & Service Management
- Integrated background task executor tracks simulation service metrics at runtime.
- Desktop logger prints structured file streams detailing Electron shell cycles.
