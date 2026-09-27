import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Cấu hình Vite độc lập dành riêng cho Vercel SPA (không phụ thuộc runtime PHP/Laravel)
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1200,
    },
});
