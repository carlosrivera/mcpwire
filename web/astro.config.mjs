import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/data/seo.mjs';

// 100% static export — deployed to GitHub Pages at $0.
// The CLI does all the heavy lifting on users' machines; this site is pure DOM.
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(new URL(page).pathname) })],
  build: {
    inlineStylesheets: 'auto',
  },
});
