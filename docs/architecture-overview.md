# Architecture Overview

Notepad Desktop is an offline-first desktop text and code editor. It is architected as a decoupled system containing two primary modules:

## 1. Backend Layer (Electron Main Process)
The main process coordinates OS-level window lifecycles and backend operations:
- **Filesystem Integration** (`fsControllers.js`): Persists binary SQLite file streams to local user data directories.
- **Window Management**: Launches a single main application container window (`main_notepad`) configured with transparency, hardware acceleration flags, and custom border frames.
- **System Tray Icon**: Integrates app management utilities (re-centering workspace coordinates, reloading UI webviews, spawning widgets) into the taskbar tray menu.
- **Structured Logging** (`logger.js`): Coordinates standard output writes to `%APPDATA%/my-notebook-desktop/notepad_runtime.log`.

## 2. Frontend Layer (React + Vite Client)
The renderer process executes standard React state-flow layouts inside the main Electron window:
- **Offline SQLite Driver** (`useSqliteData.js`): Uses WebAssembly `sql.js` to execute SQL queries in memory, flushing serializations back to disk via IPC events.
- **Unified Sidebar Tree**: Organizes note files nested within notebook folders, supporting custom sorting algorithms and drag-and-drop file re-parenting.
- **Document Tab Bar**: Manages open file states, closures, switches, and autosaves on tab state transitions.
- **Lexical Parser & Brackets Highlighter**: Analyzes raw code characters to apply styling class colors according to bracket depth layers.
- **VCS Snapshot Interval**: Runs a global React timer check every 10 minutes to auto-version modified files.
