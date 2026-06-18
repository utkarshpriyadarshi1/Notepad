#!/usr/bin/env bash

echo "==================================================="
echo "  Notepad Development Environment Setup"
echo "==================================================="
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js."
    exit 1
else
    echo "[INFO] Found Node.js version: $(node -v)"
fi

# 2. Check NPM
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed."
    exit 1
else
    echo "[INFO] Found npm version: $(npm -v)"
fi

echo ""
echo "Installing dependencies in the frontend directory..."
cd "$(dirname "$0")/../frontend"
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install npm dependencies."
    exit 1
fi

cd ..
echo "[SUCCESS] Dependencies installed successfully."
echo ""
echo "==================================================="
echo "  Setup completed successfully!"
echo "==================================================="
echo "To run the application in development mode:"
echo "  - Run 'builder/dev.sh' or run 'npm run dev' in the frontend directory."
echo ""
echo "To build and package the desktop app:"
echo "  - Run 'builder/build.sh' or run 'npm run package' in the frontend directory."
echo "==================================================="
