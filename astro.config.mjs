// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const isProd = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // Update these for your GitHub username and repo name
  site: isProd ? 'https://nuancedtire.github.io' : 'http://localhost:8000',
  base: isProd ? '/convert' : '/',
  vite: {
    plugins: [
      tailwindcss(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/@imagemagick/magick-wasm/dist/magick.wasm',
            dest: 'wasm'
          }
        ]
      })
    ],
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@imagemagick/magick-wasm'],
    },
    server: {
      allowedHosts: ['convert.exe.xyz', 'localhost'],
    },
  },
  output: 'static',
});
