import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

function trimTrailingSlash(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiProxyTarget = trimTrailingSlash(env.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL;

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/uploads': {
                    target: apiProxyTarget,
                    changeOrigin: true,
                },
            },
        },
        build: {
            chunkSizeWarningLimit: 2100,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (!id.includes('node_modules')) {
                            return;
                        }

                        if (id.includes('tinymce') || id.includes('@tinymce')) {
                            return 'tinymce';
                        }

                        if (id.includes('@ant-design/charts') || id.includes('@antv')) {
                            return 'charts';
                        }

                        return undefined;
                    },
                },
            },
        },
    };
});
