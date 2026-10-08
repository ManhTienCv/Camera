import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('framer-motion')) {
                            return 'vendor-motion';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('leaflet')) {
                            return 'vendor-maps';
                        }
                    }
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
    server: {
        host: 'localhost', // Chỉ hiển thị gọn gàng localhost, không liệt kê danh sách IP máy ảo/mạng LAN phức tạp
        strictPort: false, // TỰ ĐỘNG DÒ CỔNG: Nếu 5173 bận, tự động nhảy sang 5174, 5175... không bao giờ báo lỗi
        cors: true, // Cho phép mọi origin/host truy cập không bị chặn CORS
        watch: {
            usePolling: true,
            interval: 100,
            ignored: ['**/storage/framework/views/**', '**/node_modules/**', '**/vendor/**'],
        },
        hmr: {
            host: 'localhost',
        },
    },
});
