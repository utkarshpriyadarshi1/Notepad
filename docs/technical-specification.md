# Technical Specification & Requirements

Smritipatra is an offline-first, Electron-based desktop productivity client designed to manage sticky widgets, notebooks (folders), tasks, and markdown notes. It utilizes WebAssembly SQLite to provide lightweight, relational data management without local DB server overhead.

---

## 1. System Architecture

Smritipatra's architecture separates the desktop system wrapper from the reactive client canvas:

```mermaid
graph TD
    subgraph Electron Backend
        main[backend/main.js]
        fs[backend/fsControllers.js]
        logger[backend/logger.js]
    end
    subgraph React Frontend
        ui[App.jsx & UI Components]
        sql[sql.js WASM Engine]
        hooks[useSqliteData.js Hook]
    end
    disk[(SQLite DB File on Disk)]

    ui <--> hooks
    hooks <--> sql
    hooks -- Load/Save IPC --Node--> fs
    fs <--> disk
    main -- Create Window --> ui
    ui -- Window state/drag IPC --> main
    ui -- Logs IPC --> logger
```

### 1.1 Backend Layer (Electron main process)
- **File Hierarchy**: Located in `backend/`. Primary file is `backend/main.js` with controller helpers `fsControllers.js`, `serviceController.js`, and `logger.js`.
- **Role**:
  - Spawns and manages rendering windows (`BrowserWindow` instances) for the dashboard and individual notes.
  - Registers IPC channels for filesystem reading/writing, shell external URL redirect, application cache status query, and runtime logs diagnostic.
  - Implements a window drag controller (`drag-window` channel) enabling custom frameless drag areas.
  - Integrates the taskbar tray context menu (`rebuildTrayMenu`), permitting note creation and rescue actions.

### 1.2 Frontend Layer (React + Vite Client)
- **File Hierarchy**: Located in `frontend/`. Primary component is `App.jsx` with tabbed settings components inside `components/settings/`.
- **Role**:
  - Controls layout routing (Toggleable Task List vs. Markdown editor canvas).
  - Handles theme-specific skin parameters (Glassmorphism theme overlays and custom colors).
  - Connects to SQLite database events using standard React states.

### 1.3 Offline SQLite Storage Engine
- **Library**: `sql.js` (WebAssembly build of SQLite3).
- **Process**:
  - The SQLite database file (`smritipatra_data.db`) is read from user data directories as a binary stream and loaded into WASM memory.
  - Operations (inserting tasks, pinning widgets, renaming folders) run synchronously in memory.
  - Changes are serialized back to a `Uint8Array` binary block and pushed via Electron IPC to the disk.

---

## 2. Technical Requirements

### 2.1 Developer Requirements
- **Node.js**: LTS version v18.0.0 or higher.
- **Package Manager**: npm v9.0.0 or higher.
- **Operating Systems**: Windows 10/11, macOS 10.15+, or Linux (kernel 5.0+).
- **Build Tooling**: `electron-builder` for packaging installers.

### 2.2 Client Environment Requirements
- **Disk Space**: ~200 MB for installation binaries + data files.
- **Memory**: ~120 MB RAM per active note window (tuned V8 constraints).
- **Database File Location**: `%APPDATA%/Smritipatra/smritipatra_data.db` (on Windows).

---

## 3. Database Schema Specification

The database contains the following tables and relation constraints (Version 6):

```mermaid
erDiagram
    sys_migrations {
        INTEGER migration_id PK
        INTEGER version_build UNIQUE
        DATETIME executed_at
    }
    sticky_folders {
        TEXT folder_uuid PK
        TEXT folder_name
        DATETIME created_at
        DATETIME updated_at
    }
    sticky_widgets {
        TEXT widget_uuid PK
        TEXT parent_folder_uuid FK
        TEXT widget_title
        TEXT widget_theme_preset
        TEXT widget_view_mode
        TEXT widget_markdown_content
        INTEGER placement_x_pos
        INTEGER placement_y_pos
        INTEGER geometry_width
        INTEGER geometry_height
        DATETIME created_at
        DATETIME updated_at
        INTEGER is_pinned
    }
    task_items {
        TEXT item_uuid PK
        TEXT parent_widget_uuid FK
        TEXT item_text_payload
        INTEGER is_marked_completed
        DATETIME created_at
        DATETIME updated_at
    }
    
    sticky_folders ||--o{ sticky_widgets : contains
    sticky_widgets ||--o{ task_items : contains
```
