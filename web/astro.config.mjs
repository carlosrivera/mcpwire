import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 100% static export — deployed to Cloudflare Pages at $0.
// The CLI does all the heavy lifting on users' machines; this site is pure DOM.
export default defineConfig({
  site: 'https://mcpwire.co',
  trailingSlash: 'never',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
