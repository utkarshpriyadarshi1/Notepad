# Notepad 📝

**Notepad** is an offline, high-productivity desktop code and text editor. Designed as a sleek alternative to editors like Notepad++, it features a unified sidebar explorer, a horizontal document tabs interface, lexical syntax highlighting with bracket-pair colorization, code auto-formatters, automatic file versioning, and SQLite-backed local storage inside a modern glassmorphic interface.

---

## ✨ Key Features

- 📁 **Unified Explorer Sidebar**: A collapsible folder and file tree view with custom sorting (custom, alphabetical, priority, newest/oldest) and drag-and-drop file categorization.
- 📑 **Multi-Document Tabs**: A scrollable horizontal tab bar to easily switch between multiple open text or code files, with a glassmorphism landing dashboard when all tabs are closed.
- 🎨 **Syntax Highlighting & Bracket Colorizer**: A robust syntax highlighter with bracket pair colorization (depths 0–3) for Java/Spring (YAML, properties), React (JS, JSX, TS, TSX), and PostgreSQL SQL.
- ⚙️ **Code Auto-Formatters**: Built-in formatters for JSON, Java, React, XML/HTML, CSS, YAML, Properties, and Postgres SQL (keywords uppercase + alignment).
- 🔄 **VCS Auto-Versioning**: A background worker that automatically takes version snapshots of modified open tabs every 10 minutes to prevent data loss.
- 💾 **Native SQLite Storage**: Secure local data persistence in SQLite powered by WebAssembly SQL.js, optimized for zero latency and complete privacy.
- 🛡️ **Diagnostics & Log Terminal**: Real-time stats for database, log files, and browser cache. Easily perform diagnostics checks, clear caches, and review filterable, color-coded system log streams in Settings.
- 🌍 **Internationalization**: Full UTF-8 encoding support to write in any language (English, Sanskrit, Hindi, Japanese, Arabic, Emoji).
- 📦 **Standalone Packaging**: Ready to compile into independent installers (.exe, .dmg, .AppImage) via builder scripts.

---

## 📂 Project Directory Structure

```text
├── builder/             # Onboarding setup, local dev server, and production build/package scripts
├── backend/             # Electron main process (lifecycle events, tray menu, OS filesystem IPC handlers)
├── frontend/            # React + Vite client application codebase (components, styles, hooks)
├── docs/                # Technical specs, architecture docs, schemas, and historical changelogs
│   └── schema/          # Offline database schemas (schema.sql, data.sql) for developer reference
└── app.config.json      # Central configuration for app name, versions, icons, and theme colors
```

---

## 🚀 Getting Started

Getting started with local development is straightforward:

### 1. Run the Onboarding Setup Script
Run the script appropriate for your platform to install dependencies and configure credentials:
- **Windows**: `builder\setup.bat` (Generates and trusts a local self-signed code-signing certificate; requires Administrator privileges).
- **macOS / Linux**: `chmod +x builder/setup.sh && ./builder/setup.sh`

### 2. Run the Development Server
Launch Vite and Electron concurrently to start the hot-reloading app window:
- **Windows**: `builder\dev.bat`
- **macOS / Linux**: `./builder/dev.sh`

### 3. Build & Package (Production)
Compile the production installer packages:
- **Windows**: `builder\build.bat`
- **macOS / Linux**: `./builder/build.sh`

All compiled installers will be written to `frontend/dist/`.

---

## 📖 Documentation Reference

For deeper technical insight, consult our documentation folder:
- [Architecture Overview](docs/architecture-overview.md)
- [Database Schema](docs/database-schema.md)
- [Technical Specification](docs/technical-specification.md)
- [Feature Catalog](docs/feature-catalog.md)
- [Development Phases](docs/development-phases.md)
- [Changelog](docs/changelog.md)

---

## 🤝 Contributing & Community

We welcome contributions of all types! To get started:
- Review the [Contributing Guidelines](CONTRIBUTING.md) for environment setup and workflow standards.
- Read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand community expectations.
- Consult the [Security Policy](SECURITY.md) to report potential vulnerabilities.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
