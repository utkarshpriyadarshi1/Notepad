# Contributing to Notepad 📝

Thank you for your interest in contributing to **Notepad**! We welcome bug fixes, documentation improvements, feature additions, and suggestions.

To ensure a smooth collaboration, please follow the guidelines outlined below.

---

## 🤝 Code of Conduct

By participating in this project, you agree to abide by the terms of our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🛠️ Local Development Setup

To get started with development, make sure you have:
- **Node.js** (LTS version v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Git**

### 1. Fork & Clone
Fork the repository on GitHub, then clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/notepad.git
cd notepad
```

### 2. Run Setup Script
We package dependencies and platform-specific builders in separate directories. Run the onboarding setup script appropriate for your platform to install node dependencies and register a self-signed code-signing certificate (needed for secure Electron execution):
*   **Windows**: Run `builder\setup.bat` as Administrator.
*   **macOS / Linux**: Run `chmod +x builder/setup.sh && ./builder/setup.sh`

### 3. Launch Development Server
To launch Vite (frontend development server) and Electron concurrently with live hot-reloading:
*   **Windows**: Run `builder\dev.bat`
*   **macOS / Linux**: Run `./builder/dev.sh`

### 4. Build and Package
To compile client assets and package standalone installation binaries:
*   **Windows**: Run `builder\build.bat`
*   **macOS / Linux**: Run `./builder/build.sh`

All built installers will be written to the `frontend/dist/` directory.

---

## 📁 Repository Structure

```text
├── builder/             # Automation, onboarding, and platform packaging scripts
├── backend/             # Electron main process (lifecycle, IPC channels, log streams)
├── frontend/            # React + Vite renderer codebase
│   ├── public/          # Static assets (sql-wasm.wasm, icons, favicons)
│   └── src/             # UI elements, editor workspaces, components, and hooks
└── docs/                # Architecture plans, database schemas, and changelogs
```

---

## 💡 Coding Standards & Core Patterns

To keep the codebase clean, robust, and readable:
*   **Offline-First**: All user notes, tasks, events, and configurations persist locally in an offline SQLite database (`notepad_data.db` inside app data directory) powered by WebAssembly `sql.js`. Avoid introducing remote server APIs unless explicitly requested.
*   **State Stability**: Ensure React components don't churn hooks or listeners. Use stable references (`useRef` caches) for dynamically bound event listeners, such as keypress listeners and window persistence loops, to avoid CPU spikes and memory leaks.
*   **Styling**: Use Vanilla CSS variables and utility classes. Keep styles aligned with the modern dark/light glassmorphic theme.

### Database Schema Migrations

If your contribution alters database tables or introduces new columns:
1. Do NOT modify existing tables in place without registering schema migrations.
2. Increment `LATEST_SCHEMA_VERSION` inside [dbController.js](frontend/src/hooks/sqlite/dbController.js).
3. Append a new migration script blocks in the migrations array inside [dbController.js](frontend/src/hooks/sqlite/dbController.js) (using SQL DDL) so existing databases upgrade safely.
4. Update the schema diagrams in [database-schema.md](docs/database-schema.md) and [technical-specification.md](docs/technical-specification.md).

---

## 📬 Pull Request Process

1. **Create a branch**: Make your changes in a branch off the `master` or `main` branch. Use a descriptive name: `feature/your-feature-name` or `bugfix/issue-description`.
2. **Build and test locally**: Ensure the codebase compiles cleanly and that no regression occurs:
    ```bash
    cd frontend
    npm run build
    ```
3. **Format and clean up**: Remove unused logs, check linting warnings, and keep file structures neat.
4. **Submit Pull Request**: Open a PR to the main repository. Fill out the [Pull Request Template](.github/pull_request_template.md) completely, detailing what was modified, how it was verified, and references to any relevant issues.
