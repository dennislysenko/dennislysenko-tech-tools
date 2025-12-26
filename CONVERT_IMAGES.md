# Converting Social Preview Images (SVG → JPG)

I've created SVG versions of your social preview images. You need to convert them to JPG format for optimal performance.

## Files to Convert

1. `public/og-image.svg` → `public/og-image.jpg`
2. `public/screenshot-resizer-og.svg` → `public/screenshot-resizer-og.jpg`

---

## Method 1: Online Converter (Fastest)

### CloudConvert (Recommended)
1. Go to https://cloudconvert.com/svg-to-jpg
2. Upload the SVG file
3. Set quality to **90%**
4. Set dimensions to **1200×630** (if prompted)
5. Download the JPG
6. Replace the `.svg` file with the `.jpg` file in `/public/`

### Alternative: Convertio
- https://convertio.co/svg-jpg/

---

## Method 2: Using Browser (Chrome/Edge)

1. **Open the SVG file** in Chrome/Edge:
   - Right-click `og-image.svg` → Open With → Chrome
2. **Take a screenshot**:
   - Press F12 (DevTools)
   - Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
   - Type "screenshot" → Select "Capture screenshot"
3. **Resize and optimize**:
   - Use Preview (Mac) or Paint (Windows) to resize to exactly 1200×630 px
   - Export as JPG at 85-90% quality

---

## Method 3: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Convert og-image.svg
convert -density 300 -resize 1200x630 -quality 90 public/og-image.svg public/og-image.jpg

# Convert screenshot-resizer-og.svg
convert -density 300 -resize 1200x630 -quality 90 public/screenshot-resizer-og.svg public/screenshot-resizer-og.jpg
```

Install ImageMagick:
- **Mac**: `brew install imagemagick`
- **Ubuntu/Debian**: `sudo apt-get install imagemagick`
- **Windows**: Download from https://imagemagick.org/

---

## Method 4: Using Inkscape (Most Accurate)

1. **Install Inkscape** (free): https://inkscape.org/
2. **Open SVG**: File → Open → Select `og-image.svg`
3. **Export as PNG first**:
   - File → Export PNG Image
   - Set width: 1200 px
   - Set height: 630 px
   - Export
4. **Convert PNG to JPG** (using Preview/Paint or online converter)

---

## Method 5: Using Canva (Best Quality)

1. Go to https://canva.com
2. Create custom size: 1200×630 px
3. **Upload SVG** as background
4. Download as JPG (quality: recommended/standard)

---

## After Conversion

### Verify the Images

1. **Check dimensions**:
   ```bash
   file public/og-image.jpg
   # Should show: 1200 x 630
   ```

2. **Check file size**:
   - Should be < 300KB (ideally 150-250KB)
   - If larger, reduce quality to 85%

3. **Visual check**:
   - Open in browser/image viewer
   - Text should be sharp and readable
   - Colors should be vibrant
   - No compression artifacts

### Clean Up

After successful conversion, you can delete the SVG files:

```bash
rm public/og-image.svg
rm public/screenshot-resizer-og.svg
```

### Rebuild and Deploy

```bash
npm run build
# Deploy to production
```

### Test Social Previews

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
   - Enter: `https://tools.dennislysenko.tech/screenshot-resizer`
   - Click "Scrape Again" if you previously tested

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter: `https://tools.dennislysenko.tech/screenshot-resizer`

3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
   - Enter: `https://tools.dennislysenko.tech/screenshot-resizer`

---

## Recommended Approach

**For quickest results**: Use CloudConvert (Method 1)

**For best quality**: Use Canva (Method 5) - allows you to tweak the design before exporting

**For automation**: Use ImageMagick (Method 3) - can be scripted for future tools

---

## Design Notes

### Generic Image (`og-image.svg`)
- Purple gradient background
- "Developer Tools" title
- "by Dennis Lysenko" subtitle
- Four tool icons (mobile, wrench, code, gear)
- Domain name at bottom

### Screenshot Resizer Image (`screenshot-resizer-og.svg`)
- Purple gradient background (matching brand)
- Left: Visual mockups of iPhone/iPad screens with dimensions
- Right: Tool name and key benefit
- Domain name at bottom

Both images follow Facebook/LinkedIn OG image best practices:
- 1200×630 px (1.91:1 ratio)
- Important content within safe zone
- High contrast white text on gradient
- Large, readable fonts (72px title, 24-32px supporting text)

---

**Questions?** The SVG files are in `/public/` - you can preview them in a browser to see the design before converting.
