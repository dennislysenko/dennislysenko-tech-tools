# Agent Instructions for dennislysenko-tech-tools

This file contains instructions for AI agents (Claude Code, etc.) working on this multi-tool developer platform.

---

## Adding a New Tool

When the user asks you to create a new tool, follow these steps:

### 1. Create the Tool Page

Create a new page in `src/pages/[tool-name].astro` with:

```astro
---
import Layout from '../layouts/Layout.astro';
// ... other imports

// SEO metadata
const title = 'Tool Name - Brief Description (50-60 chars)';
const description = 'Detailed description for search engines and social sharing (150-160 chars). Include key features and benefits.';
const keywords = 'primary keyword, secondary keyword, tool type, target audience, ...';

// JSON-LD Structured Data for SoftwareApplication
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Tool Name",
  "description": description,
  "url": `https://tools.dennislysenko.tech/${toolName}`,
  "applicationCategory": "UtilityApplication", // or DeveloperApplication, DesignApplication, etc.
  "operatingSystem": "Any (Browser-based)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Key feature 1",
    "Key feature 2",
    "Key feature 3",
    // ... add 4-6 features
  ],
  "screenshot": `https://tools.dennislysenko.tech/${toolName}-og.jpg`,
  "author": {
    "@type": "Person",
    "name": "Dennis Lysenko",
    "url": "https://dennislysenko.tech"
  },
  "browserRequirements": "Requires JavaScript. Works with modern browsers (Chrome, Firefox, Safari, Edge).",
  "softwareVersion": "1.0.0",
  "datePublished": new Date().toISOString().split('T')[0] // Current date
};
---

<Layout
  title={title}
  description={description}
  keywords={keywords}
  canonicalUrl="/{tool-name}"
  ogImage="/{tool-name}-og.jpg"
  jsonLd={jsonLd}
>
  <!-- Your tool UI here -->
</Layout>
```

### 2. Update the Root Landing Page

Add the new tool to `src/pages/index.astro`:

```astro
const tools = [
  {
    name: 'Screenshot Resizer',
    description: 'Resize screenshots for every iPhone and iPad size required by the App Store',
    url: '/screenshot-resizer',
    icon: '📱'
  },
  {
    name: 'Your New Tool',  // Add here
    description: 'Brief description of what the tool does',
    url: '/your-new-tool',
    icon: '🔧'  // Choose appropriate emoji
  }
];
```

### 3. Create Social Preview Image (IMPORTANT!)

**Every tool MUST have its own social preview image** for optimal social sharing.

#### Image Specifications:
- **Dimensions**: 1200×630 px (Facebook/LinkedIn standard)
- **Format**: JPG (optimized, <300KB) or PNG
- **Location**: `/public/{tool-name}-og.jpg`
- **Design Guidelines**:
  - Tool name prominently displayed
  - Key benefit or tagline
  - Visual element (mockup, icon, or illustration)
  - Brand colors matching the site
  - High contrast, readable text (minimum 60px font)
  - Keep important content within 1200×600px safe zone

#### Process:
1. **Design the image** using:
   - Canva (https://canva.com) - Use 1200×630 template
   - Figma (https://figma.com) - Create custom frame
   - Or generate SVG and convert to JPG/PNG

2. **Content to include**:
   - Tool name (large, bold)
   - Tagline or key benefit (1 line)
   - Optional: Visual representation of the tool
   - Optional: "Free • Browser-Based • Privacy-Focused"
   - Small branding: "tools.dennislysenko.tech" or logo

3. **Save the file**:
   - Filename: `/public/{tool-name}-og.jpg`
   - Export as JPG (85-90% quality) or PNG
   - Verify file size < 1MB (ideally < 300KB)

4. **Update tool page** to reference the image:
   ```astro
   ogImage="/{tool-name}-og.jpg"
   ```

5. **Verify** after deployment:
   - Facebook Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

### 4. Test SEO Implementation

After creating the tool page:

1. Build the site: `npm run build`
2. Verify sitemap includes new page: `dist/sitemap-0.xml`
3. Check meta tags in built HTML: `dist/{tool-name}/index.html`
4. Validate JSON-LD: https://validator.schema.org/
5. Test rich results: https://search.google.com/test/rich-results

### 5. Build and Deploy

**This project is deployed to Vercel and auto-deploys on every push to `main`.**

No manual deployment needed! Just commit and push:

```bash
git add .
git commit -m "Add new tool"
git push origin main
```

Vercel will automatically:
- Build the Astro project
- Run deployment checks
- Deploy to production at https://tools.dennislysenko.tech

Monitor deployment status at: https://vercel.com/dashboard

### 6. Post-Deployment Verification

- [ ] Tool page accessible at `https://tools.dennislysenko.tech/{tool-name}`
- [ ] Listed on root landing page
- [ ] Sitemap updated (check /sitemap-0.xml)
- [ ] Rich results test passes
- [ ] Social preview displays correctly (Facebook Debugger)
- [ ] Mobile-friendly test passes
- [ ] Lighthouse SEO score 90+

---

## Updating the Generic Landing Page OG Image

The root landing page (`/`) should have a generic social preview image that represents the entire platform.

**Location**: `/public/og-image.jpg`

**Content**:
- Main text: "Developer Tools"
- Subtitle: "by Dennis Lysenko"
- Tagline: "Free, Privacy-Focused Tools for Developers"
- Design: Clean, modern, brand colors
- Optional: Multiple tool icons or abstract tech imagery

**When to update**:
- When launching the site initially
- When significantly redesigning the brand
- When adding major new categories of tools

---

## SEO Best Practices for This Project

### Meta Tags
- **Title**: 50-60 characters, include primary keyword
- **Description**: 150-160 characters, compelling and descriptive
- **Keywords**: 5-10 relevant keywords, comma-separated

### JSON-LD Schema
- Always use `SoftwareApplication` type for tools
- Include all required properties: name, description, url, offers
- Add 4-6 items to `featureList`
- Set `price: "0"` for free tools
- Update `datePublished` to current date for new tools

### Performance
- Keep tools lightweight (browser-based, no server uploads)
- Optimize images and assets
- Maintain Lighthouse performance score 90+

### Accessibility
- Use semantic HTML (header, main, section, aside)
- Add alt text to all images and SVGs
- Ensure keyboard navigation works
- Maintain Lighthouse accessibility score 90+

---

## Common Tasks

### Update Sitemap
Sitemap is automatically generated on build. No manual updates needed.

### Update robots.txt
Located at `/public/robots.txt`. Modify only if you need to block specific paths.

### Add New SEO Documentation
Update `SEO_NEXT_STEPS.md` and `SEO_VERIFICATION.md` as the project evolves.

---

## Questions?

Refer to these docs:
- `SEO_NEXT_STEPS.md` - SEO implementation overview and next steps
- `SEO_VERIFICATION.md` - Complete guide to SEO testing tools
- `SOCIAL_IMAGES.md` - Detailed guide for creating social preview images

---

**Last Updated**: 2025-12-25
**Maintained by**: AI agents working with Dennis Lysenko
