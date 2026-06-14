const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

console.log('⚡ Starting build and packaging pipeline...');

try {
    // 0. Auto-increment app version
    console.log('🔄 Bumping version using increment_version.py...');
    try {
        execSync('python increment_version.py patch', { cwd: __dirname, stdio: 'inherit' });
    } catch (pyError) {
        try {
            execSync('py increment_version.py patch', { cwd: __dirname, stdio: 'inherit' });
        } catch (pyError2) {
            console.warn('⚠️ Python not found or failed to run increment_version.py, skipping version bump.');
        }
    }

    // 1. Build frontend React assets
    console.log('📦 Building frontend React UI assets...');
    execSync('npm run build', { cwd: frontendDir, stdio: inheritIo() });

    // 2. Package Electron desktop app
    console.log('🚀 Packaging Electron application with electron-builder...');
    // We run electron-builder inside the frontend directory
    execSync('npx electron-builder', { cwd: frontendDir, stdio: inheritIo() });

    console.log('✅ Build and packaging completed successfully!');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

function inheritIo() {
    return 'inherit';
}
