import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  build: {
    assets: '_astro'
  }
});
