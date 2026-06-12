// vite.config.mjs
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    server: {
        host: '127.0.0.1', // 👈 CRITICAL: Force raw IPv4 numeric binding
        port: 5173,
        open: false,
        strictPort: true
    },
    base: './'
});
