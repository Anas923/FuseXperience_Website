import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://fusexperience.com',
  output: 'static',
  vite: {
    ssr: {
      noExternal: ['three', 'gsap'],
    },
  },
});
