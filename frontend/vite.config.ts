import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // Keep the `/api` prefix when proxying so backend routes with
        // `app.setGlobalPrefix('api')` continue to match.
        // (previously the config removed `/api`, causing 404s)
      }
    }
  }
})
