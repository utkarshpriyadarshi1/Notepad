# Scalability and Deployment

## 1. Electron Packaging
Production builds are packaged using `electron-builder`. 
- **Windows**: Produces a standardized NSIS installer with options for startup menu entries and installation directories.
- **Mac**: Packages target dmg bundles with custom category details.

## 2. Multi-Module Scaling
If a web application is requested in the future:
- The React application inside `frontend/` can be deployed independently as a static web bundle.
- The SQLite data layer can be migrated to a remote server REST API backend, modifying the client hooks to direct fetch operations to server end-points.
