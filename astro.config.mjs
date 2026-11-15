// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// mikegomez.dev — built on The Sauce starter-astro foundation.
export default defineConfig({
  site: 'https://mikegomez.dev',
  integrations: [sitemap()],
});
