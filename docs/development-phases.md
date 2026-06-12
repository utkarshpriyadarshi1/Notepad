# Development Phases

This project follows an iterative structure:

## Phase 1: Decoupling and Module Mapping
- Organize files into `backend/` (Electron main) and `frontend/` (React UI).
- Setup isolated package dependencies inside the `frontend/` folder.
- Re-map and test import declarations referencing root config files.

## Phase 2: Builder Script Setup
- Construct cross-platform Javascript launchers (`build.js`, `clean.js`).
- Introduce automatic Python version bumpers and Windows self-signed packaging certificate setup scripts.

## Phase 3: Packaging and Validation
- Perform local Vite builds.
- Configure Electron-Builder to bundle outputs into executable packages.
