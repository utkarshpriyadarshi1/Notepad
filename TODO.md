# Notepad - TODO Tracker

Track pending tasks, improvements, and achievements for the Notepad application.

## 🏆 Achievements (Completed)
- [x] **Unified Explorer Sidebar**: Integrated folders and files into a single collapsible sidebar tree with drag-and-drop organization.
- [x] **Tabbed Workspace System**: Added support for editing multiple documents in horizontal, closable document tabs.
- [x] **Lexical Syntax Highlighter**: Constructed a fast, single-pass syntax parser with color-coded bracket depth levels (0-3) for Java, Spring (YAML, properties), React, and PostgreSQL SQL.
- [x] **Code Formatters**: Implemented automatic beautification and layout alignment for JSON, SQL, Properties, YAML, React, and Java.
- [x] **VCS Auto-Versioning**: Established a robust background timer that creates local SQLite revision checkpoints for open documents every 10 minutes.
- [x] **Clean Decoupled Architecture**: Cleaned up the app layout and consolidated environment scripts in `builder/` and client code in `frontend/`.
- [x] **Centralized Configuration**: Configured versions, icons, and theme colors into a single root `app.config.json` file.
- [x] **Diagnostics & System Logs View**: Added cache metrics trackers, cache cleaning, full application reset routines, and a parsed scrollable terminal log view in Settings.

## 📋 Backlog & Feature Pipeline
- [ ] **Find & Replace Enhancements**: Add toggle buttons for case-sensitivity, whole word match, and regular expression (regex) search patterns.
- [ ] **Custom Snippets & Boilerplates**: Introduce template blueprints for quickly creating boilerplate config files (e.g., React template, application.yml, standard SQL schema).
- [ ] **VCS Revision Timeline**: Expose a visual side-by-side diff timeline comparing the active file with historical snapshots.
- [ ] **Additional Syntax Highlighters**: Extend syntax support to C++, Python, and Markdown-code-block block highlight rendering.
- [ ] **Custom Editor Skins**: Add dark themes like Monokai, Dracula, or Solarized alongside the default glassmorphic themes.
- [ ] **Cross-Platform Installers**: Setup automated pipelines to package native macOS .dmg and Linux .AppImage installer binaries.
