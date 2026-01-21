import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Determine shared path - in Docker it's mounted at /shared, locally it's ../shared
const getSharedPath = () => {
  const dockerPath = '/shared';
  const localPath = path.resolve(__dirname, '../shared');
  
  // Check if we're in Docker (shared mounted at /shared)
  if (fs.existsSync(dockerPath) && fs.statSync(dockerPath).isDirectory()) {
    return dockerPath;
  }
  
  // Otherwise use local path
  return localPath;
};

// Determine backend URL - use Docker service name in Docker, localhost locally
const getBackendUrl = () => {
  // Check if we're in Docker (shared mounted at /shared)
  const isDocker = fs.existsSync('/shared') && fs.statSync('/shared').isDirectory();
  
  // Allow override via environment variable
  if (process.env.VITE_BACKEND_URL) {
    return process.env.VITE_BACKEND_URL;
  }
  
  // Use Docker service name in Docker, localhost locally
  return isDocker ? 'http://backend:3001' : 'http://localhost:3001';
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Alias @shared to the shared directory (works in both Docker and local)
      '@shared': getSharedPath(),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Bind to all interfaces for Docker
    proxy: {
      // Proxy API requests to the NestJS backend
      '/api': {
        target: getBackendUrl(),
        changeOrigin: true,
        secure: false,
      },
    },
    // Allow serving files from parent directories (for @shared imports)
    fs: {
      allow: ['..', '/shared'],
    },
    watch: {
      usePolling: true, // Enable polling for Docker volume file changes
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
