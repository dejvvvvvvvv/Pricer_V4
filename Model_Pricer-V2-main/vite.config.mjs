import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath, URL } from "node:url";
// import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  build: {
   outDir: "build",
   chunkSizeWarningLimit: 2000,
  },
  plugins: [
    tsconfigPaths(), 
    react(),
    // This plugin copies the Kiri:Moto engine files to the build directory
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: 'public/kiri/**/*',
    //       dest: 'kiri'
    //     }
    //   ]
    // })
  ],
  // Project uses @/.. imports in many places; the repo doesn't include a tsconfig/jsconfig
  // with path mapping, so we define it here to avoid Vite import-resolution errors.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    // Local dev proxy to backend-local (Express) on :3001.
    // IMPORTANT: backend-local has CORS allowlist; we strip the Origin header
    // so the request behaves like a same-origin server-side call.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        // Keep /api prefix on the backend
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('Origin');
          });
        },
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
});
