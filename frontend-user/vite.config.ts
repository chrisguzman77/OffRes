import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/health': 'http://localhost:8000',
      '/llm': 'http://localhost:8000',
      '/wallet': 'http://localhost:8000',
      '/vendor': 'http://localhost:8000',
      '/sync': 'http://localhost:8000',
      '/map': 'http://localhost:8000',
    },
  },
})
