import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tools.dennislysenko.tech',
  integrations: [
    sitemap({
      // Customize sitemap options
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Custom filter to include/exclude pages if needed
      filter: (page) => !page.includes('/api/'), // Example: exclude API routes if any
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
