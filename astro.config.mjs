import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stlservices.co.nz',
  trailingSlash: 'always',
  output: 'static',
  adapter: netlify(),
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/thanks/') && !page.endsWith('/404/'),
    }),
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  build: {
    assets: '_astro'
  }
});
