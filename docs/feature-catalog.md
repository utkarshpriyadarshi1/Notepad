# Smritipatra - Feature Catalog

Smritipatra is a local-first sticky notes client. This document catalogues all core features, options, and capabilities currently implemented in the app.

---

## 1. Window Sizing & Dashboard Integration

### 1.1 Centralized Preferences Dashboard
- **Auto-open on Startup**: The app always launches directly into the expanded dashboard mode (sized at a standard Windows application footprint of `920x550`, centered and non-intrusive).
- **Tabbed Settings Overlay**: Accessible from the gear icon in the header, splitting features into:
  - **Preferences**: Allows theme presets configuration, database backups (import/export), and engine service start/stop triggers.
  - **Widgets Manager**: Lists all notebooks (folders) and notes, allowing users to show, hide, pin, rename, or delete specific note instances from a single canvas.

---

## 2. Note Creation & Notebook Grouping

### 2.1 Notebook Folders
- Create virtual notebook dividers to group related sticky note widgets.
- Rename folders and delete them (cascades note deletions safely).
- Default folder (`My Notebook`) created automatically on first run.

### 2.2 Sticky Widget Notes
- Spawns separate draggable note canvases.
- Create new notes directly inside folders from the widgets dashboard or using the `+` button in note headers.
- Export specific widgets to local JSON backups, separate from full system exports.

---

## 3. Note Types & Content Rendering

### 3.1 Checklist Widget Mode
- Task forms for adding tasks with single-line entry.
- Quick checkbox click handler to mark items as completed (which crosses them out).
- Clear completed tasks instantly with a check-all action.
- Edit/rename individual tasks and delete tasks globally.

### 3.2 Markdown Note Mode
- Fully featured Markdown editor.
- Custom toolbar with quick helpers for:
  - Header formatting (`#`, `##`, `###`)
  - Bold, Italic, and Strikethrough inline styling
  - Lists (Ordered and Bullet lists)
  - Code blocks and horizontal dividers
- Clean parsing and rendering of Markdown on screen.

---

## 4. Visual Themes & Preferences

### 4.1 Harmonious Color Themes
Choose from 5 styles:
- **Glassmorphism**: A modern semi-transparent blur look.
- **Yellow**: Warm pastel sticky note look.
- **Pink**: Rose pastel look.
- **Blue**: Cool sky pastel look.
- **Green**: Soft emerald pastel look.
- Support for **Dark Mode** toggle.

### 4.2 Pin & Window Coordinates Persistence
- **Always Pinned Notes**: Toggle the pin icon on any note to set it to "always-on-top". Pinned notes automatically reopen in their separate windows when the app is restarted.
- **Cascading Casters**: Quick recovery action to reset all window coords back to the center of the primary display workspace.
- **Memory Diagnostic Purging**: In-dashboard analytics showing SQLite file size, runtime log size, and V8 cache bytes, complete with diagnostic cache purge triggers.
