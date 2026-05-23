import {defineConfig} from 'vite'
import react, {reactCompilerPreset} from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'; // 👈 1. Import the new Tailwind compiler plugin

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(),
        tailwindcss(),
        babel({presets: [reactCompilerPreset()]})], server: {
        open: false, // Prevents unneeded browser tab popups
    },
})
