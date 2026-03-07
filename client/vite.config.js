import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This proxy is the KEY connection bridge:
// Any request from the React app to /socket.io/* or /api/*
// is forwarded to the Flask backend at port 5000.
// This avoids CORS issues in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,   // expose on local network (0.0.0.0)
    proxy: {
      // WebSocket upgrade requests (Socket.IO handshake + persistent WS)
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,           // <-- upgrade HTTP → WebSocket
        changeOrigin: true,
      },
    },
  },
})
