# Notepad - Feature Catalog

Notepad is an offline-first code and text editor. This document catalogues all core features, options, and capabilities currently implemented in the app.

---

## 1. Workspace Explorer & Layout

### 1.1 Collapsible Unified Sidebar
- **Resizable Sidebar Explorer**: A single drag-to-resize sidebar panel that nests file documents inside notebook folders.
- **Search Filtering**: Live database lookup that filters files and folders based on title, content, checklist entries, or description.
- **Custom sorting**: Sort document lists instantly by:
  - Custom drag-and-drop order
  - Alphabetical order (Ascending/Descending)
  - Time of creation (Newest/Oldest)
  - Theme priority color weight
- **Hover Shortcuts**: Quick action buttons on folders to directly append new notes inside them or rename/delete folders.

### 1.2 Multi-Document Tab Bar
- **Tab Swapper**: Horizontal tabs showing all open files with priority color indicators and close icons.
- **Auto-Switching Selection**: Automatically focuses adjacent files when closing active tabs.
- **Glassmorphism Landing Dashboard**: Displays a premium placeholder dashboard with key editor shortcuts and application configurations when all file tabs are closed.

---

## 2. Editor Workspace & Formatters

### 2.1 Lexical Bracket Pair Colorizer
- **Character Highlight Lexer**: Analyzes syntax tokens for Java/Spring (YAML, properties), React (JS, JSX, TS, TSX), and SQL.
- **Bracket Pair Matching**: Colorizes brackets (`()`, `[]`, `{}`) by nested depth (depths 0–3) to improve nested code visibility.
- **Contextual Insert Toolbar**: Quick click-helpers in Markdown mode to inject style symbols (bold, italic, list formatters).

### 2.2 Advanced Code Formatters
- **SQL Formatter**: Standardizes spacing, indentation, and converts PostgreSQL keywords to uppercase.
- **Properties & YAML Formatters**: Align keys and values cleanly.
- **Bracket Indenter**: Formats curly braces and square brackets indents for Java, React, HTML, XML, and CSS files.

---

## 3. Data Integrity & Backups

### 3.1 10-Minute Auto-Versioning
- **Global VCS snapshots worker**: Automatically checks all open documents every 10 minutes and commits snapshot revisions to SQLite for any modified notes.
- **History Panel**: View past snapshots of the current file and restore previous commits.

### 3.2 Preferences, Diagnostics & Log Viewer
- **Preferences & System Panels**:
  - **Config Tab**: Exposes backup export/import actions, application configurations, language settings, and core service status indicators.
  - **Diagnostics Tab**: Telemetry tool outlining actual allocations for browser cache, SQLite database files, and system logs, with hard maintenance actions (clear cache, clean logs, app reset).
  - **System Logs Tab**: An interactive dark monospaced terminal displaying parsed log logs from the frontend and backend. Includes text search, category grouping (UI vs Core Engine), level filters, and clipboard copy.
- **JSON Import/Export**: Bundle the entire local SQLite schema into portable JSON files. Supports backward-compatible imports from older sticky widget database profiles.
