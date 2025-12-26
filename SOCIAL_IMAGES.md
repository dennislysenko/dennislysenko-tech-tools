# Social Preview Images Setup

## Overview
Social preview images (Open Graph images) are displayed when your tool is shared on social media platforms like Twitter, Facebook, LinkedIn, etc. Having attractive preview images significantly improves click-through rates.

## Required Images

### 1. Default OG Image (`/public/og-image.jpg`)
- **Dimensions**: 1200×630 px (Facebook/LinkedIn recommended)
- **Format**: JPG or PNG
- **File size**: < 1MB (ideally < 300KB for fast loading)
- **Safe zone**: Keep important content within 1200×600 px (some platforms crop)

**Content suggestions:**
- Site name/branding
- Brief tagline: "Free Developer Tools"
- Simple, clean design matching your site's aesthetic
- Consider a gradient or solid background with text overlay

### 2. Screenshot Resizer OG Image (Optional)
- Same dimensions: 1200×630 px
- Create a tool-specific image showing:
  - Tool name: "Screenshot Resizer"
  - Key benefit: "Resize for every iPhone & iPad size"
  - Visual element: mockup of the tool interface or device icons

### 3. Twitter Card Image (Optional)
- **Dimensions**: 1200×600 px or 1200×630 px
- Can use the same image as OG image
- Twitter supports both landscape (summary_large_image) and square (summary) formats

## Design Tools

### Free Options:
1. **Canva** (https://canva.com)
   - Template: "Facebook Post" (1200×630 px)
   - Free templates and design elements
   - Export as JPG or PNG

2. **Figma** (https://figma.com)
   - Professional design tool
   - Free for personal use
   - Create custom 1200×630 frame

3. **GIMP** (https://gimp.org)
   - Free, open-source image editor
   - Full control over design

### Paid Options:
- **Adobe Photoshop**
- **Sketch** (macOS only)
- **Affinity Designer**

## Quick Setup Guide

### Step 1: Create the Image
1. Use Canva template or create 1200×630 px canvas
2. Design with your branding colors
3. Add text: site name, tagline, or key value proposition
4. Export as JPG (quality 85-90%) or PNG

### Step 2: Add to Project
```bash
# Save to public directory
cp your-og-image.jpg public/og-image.jpg
```

### Step 3: Verify
After deploying, test your OG image using:
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Design Tips

### Do:
✅ Use high contrast text on background
✅ Keep text large and readable (minimum 60px font size)
✅ Use your brand colors
✅ Include your logo (but don't make it too large)
✅ Keep design simple and clean
✅ Test on different devices/platforms

### Don't:
❌ Use small text (< 40px) - it will be unreadable on mobile
❌ Overcrowd with too much information
❌ Use low-resolution images
❌ Forget to test the preview before deploying

## Example Design Ideas

### Option 1: Gradient Background
```
Background: Linear gradient (purple to blue)
Text: "Developer Tools" (large, white, bold)
Subtext: "Free • Privacy-Focused • Browser-Based"
```

### Option 2: Screenshot Preview
```
Background: Light gray
Left side: Screenshot of the tool interface
Right side: Tool name and key features
```

### Option 3: Minimalist
```
Background: Solid color matching your brand
Center: Large tool name
Bottom: "By Dennis Lysenko"
```

## Current Implementation

The Layout.astro is already configured to use OG images:
- Default: `/og-image.jpg`
- Each page can override with custom `ogImage` prop

```astro
<Layout
  ogImage="/custom-tool-image.jpg"
  ...
>
```

## Next Steps

1. Create `/public/og-image.jpg` (1200×630 px)
2. Optionally create tool-specific images
3. Update screenshot-resizer.astro with custom `ogImage` prop if needed
4. Deploy and test with social media debuggers

## Resources

- [Open Graph Protocol Documentation](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/best-practices)
- [OG Image Design Inspiration](https://www.opengraph.xyz/)
