import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH is only needed for GitHub *project* pages, e.g. BASE_PATH=/birdfinder/
// Cloudflare Pages / Netlify / Vercel serve from "/" so nothing to set there.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: { sourcemap: false },
});
