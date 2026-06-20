## Description

Provide a clear description of the problem solved, new features added, or changes made. Include any background context that will assist reviewers.

## Linked Issues

Closes # (issue number)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist

### 💻 Local Verification
- [ ] I have executed the Vite production compilation successfully:
  ```bash
  cd frontend
  npm run build
  ```
- [ ] I have tested changes inside the Electron application frame (`builder/dev.bat` or `./builder/dev.sh`).
- [ ] I have verified that Settings tabs (Config, Diagnostics, Logs) and sidebar explorer render cleanly.

### 💾 Data Integrity & Migrations
- [ ] If this PR modifies database schemas, I have:
  - Incremented `LATEST_SCHEMA_VERSION` inside `frontend/src/hooks/sqlite/dbController.js`.
  - Registered my schema migration rules in `dbController.js`.
  - Updated SQL schema files under `docs/schema/` and database specification guides.

### 🧹 Code Quality
- [ ] My React code does not cause unnecessary render churn or subscription loops (e.g. event listeners bound dynamically).
- [ ] I have kept styling aligned with the light/dark glassmorphic theme design.
- [ ] I have updated code comments and/or the [walkthrough.md] file if my changes introduce core logic updates.
