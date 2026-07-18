import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

const copyIndexTo404 = () => {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const indexPath = path.resolve(__dirname, './dist/index.html')
      const fourOhFourPath = path.resolve(__dirname, './dist/404.html')
      try {
        const content = readFileSync(indexPath, 'utf-8')
        writeFileSync(fourOhFourPath, content)
      } catch (e) {
        console.error('Failed to create 404.html:', e)
      }
    },
  }
}

export default defineConfig({
  base: '/person_blog/',
  plugins: [react(), copyIndexTo404()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
  },
})
