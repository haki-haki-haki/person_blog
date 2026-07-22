import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
var copyIndexTo404 = function () {
    return {
        name: 'copy-index-to-404',
        closeBundle: function () {
            var indexPath = path.resolve(__dirname, './dist/index.html');
            var fourOhFourPath = path.resolve(__dirname, './dist/404.html');
            try {
                var content = readFileSync(indexPath, 'utf-8');
                writeFileSync(fourOhFourPath, content);
            }
            catch (e) {
                console.error('Failed to create 404.html:', e);
            }
        },
    };
};
export default defineConfig({
    base: '/person_blog/',
    build: { emptyOutDir: true },
    plugins: [react(), copyIndexTo404()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
    },
});
