# Developer Setup Guide

This guide describes how to set up, run, and compile the **Smritipatra** desktop application in a local development environment.

## Prerequisites

Ensure you have the following software installed on your development machine:
- **Node.js**: Version 16.x or higher (LTS recommended)
- **NPM**: Package manager (installed automatically with Node.js)
- **Git**: Version control system

---

## 🚀 Quick Start Setup

We provide automated setup scripts in the project root to configure the developer environment, install dependencies, and setup required signing credentials.

### On Windows
Run the automated batch setup script:
```bash
setup.bat
```
> [!NOTE]
> On Windows, the script will attempt to generate a self-signed code-signing certificate for app packaging by executing `packaging-builder/setup-cert.ps1`. This requires Administrator privileges. If it fails, the app will still run in development, but packaging might fail.

### On macOS / Linux
Run the automated shell setup script:
```bash
chmod +x setup.sh
./setup.sh
```

---

## 💻 Running the Application in Development

After running the setup script successfully, run the app in hot-reloading development mode:

### Windows delegator
```bash
dev.bat
```

### macOS/Linux delegator
```bash
chmod +x dev.sh
./dev.sh
```

### Alternatively (via NPM)
Navigate to the `frontend` folder and start Vite + Electron concurrently:
```bash
cd frontend
npm run dev
```

---

## 📦 Packaging and Distribution

To compile the application into a standalone installer/binary:

### Windows builder delegator
```bash
build.bat
```

### macOS/Linux builder delegator
```bash
chmod +x build.sh
./build.sh
```

### Alternatively (via NPM)
Navigate to the `frontend` directory and package using electron-builder:
```bash
cd frontend
npm run package
```

The resulting installers and packaged bundles will be generated in `frontend/dist/`.

---

## 🧼 Cleaning Build Artifacts

To purge compilation files, vite caches, and local packages:
- Run `clean.bat` on Windows.
- Run `./clean.sh` on Unix-like platforms.
