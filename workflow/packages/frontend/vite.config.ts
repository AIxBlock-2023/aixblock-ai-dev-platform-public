/// <reference types='vitest' />
import path from 'path';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/frontend',

  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        secure: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          Host: '127.0.0.1:4200',
        },
        ws: true,
      },
    },
    port: 4200,
    host: '0.0.0.0',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'workflow-shared': path.resolve(
        __dirname,
        '../../packages/shared/src',
      ),
      'axb-embed-sdk': path.resolve(
        __dirname,
        '../../packages/axb/ui/embed-sdk/src',
      ),
      'workflow-axb-shared': path.resolve(
        __dirname,
        '../../packages/axb/shared/src',
      ),
      'workflow-blocks-framework': path.resolve(
        __dirname,
        '../../packages/blocks/community/framework/src',
      ),
    },
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    checker({
      typescript: {
        buildMode: true,
        tsconfigPath: './tsconfig.json',
        root: __dirname,
      },
    }),
  ],

  build: {
    outDir: '../../dist/packages/frontend',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      onLog(level, log, handler) {
        if (
          log.cause &&
          log.message.includes(`Can't resolve original location of error.`)
        ) {
          return;
        }
        handler(level, log);
      },
    },
  },
});
