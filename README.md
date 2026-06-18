# Notepad 📝

**Notepad** is an offline, lightweight desktop sticky note widget and task management tool. It is designed to act as a distraction-free, persistent desktop notepad that integrates checklists and Markdown rendering inside sleek, customizable glassmorphism widgets.

---

## ✨ Key Features

- 📌 **Always On Top Sticky Widgets**: Pin notes to your desktop screen so they stay active and visible above other open windows.
- 🎨 **Sleek Customization**: Switch between multiple harmonious, modern themes (Glassmorphism, Dark, Light, Amber, Rose, Sky, and Emerald).
- 🔀 **Dual-Mode Canvas**: Toggle instantly between interactive checklists (with subtasks) and Markdown rich text editing (complete with formatting tools).
- 📁 **Folder Grouping**: Categorize notes and checklist widgets into custom folders and notebooks.
- 💾 **Native Local Storage**: Persists data inside a local, performant SQLite database file powered by SQL.js WASM driver.
- 🌍 **International Language Support**: Full UTF-8 database encoding allows you to write in any language (including Sanskrit, Hindi, Japanese, Arabic, and Emoji).
- 📦 **Standalone Packaging**: Package the application into standalone installers (.exe, .dmg, .AppImage) using automated pipeline scripts.

---

## 📂 Project Directory Structure

```text
├── builder/             # Onboarding, environment dev runners, build & package scripts
├── backend/             # Electron main process files (window manager, fs controllers)
├── frontend/            # React + Vite renderer source (UI components, styling, hooks)
├── docs/                # Architecture plans, db schemas, and setup instructions
└── app.config.json      # Central configuration file for naming, versions, and icons
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
- [Development Setup](docs/development-setup.md)
- [Platform Specifications](docs/features-platforms.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
