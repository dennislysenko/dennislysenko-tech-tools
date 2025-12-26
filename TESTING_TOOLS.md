# SEO & Social Media Testing Tools - Quick Reference

Quick links to all verification tools for testing your site's SEO and social sharing.

---

## 🔍 Essential SEO Testing Tools

### Google Rich Results Test ⭐ MOST IMPORTANT
**URL**: https://search.google.com/test/rich-results

**What it tests**: Validates JSON-LD structured data
**Test URLs**:
- https://tools.dennislysenko.tech/
- https://tools.dennislysenko.tech/screenshot-resizer

**Expected**: Should detect `SoftwareApplication` schema with no errors

---

### Schema.org Validator
**URL**: https://validator.schema.org/

**What it tests**: Comprehensive JSON-LD validation
**Test URLs**:
- https://tools.dennislysenko.tech/screenshot-resizer

**Expected**: No errors in JSON-LD syntax

---

### PageSpeed Insights
**URL**: https://pagespeed.web.dev/

**What it tests**: Performance, SEO score, Core Web Vitals
**Test URLs**:
- https://tools.dennislysenko.tech/
- https://tools.dennislysenko.tech/screenshot-resizer

**Target Scores**:
- Performance: 90+
- SEO: 90+
- Accessibility: 90+
- Best Practices: 90+

---

### Google Mobile-Friendly Test
**URL**: https://search.google.com/test/mobile-friendly

**What it tests**: Mobile usability
**Expected**: "Page is mobile-friendly"

---

### Lighthouse (Chrome DevTools)
**Access**: Chrome → F12 → Lighthouse tab

**What it tests**: SEO, Performance, Accessibility, Best Practices
**Target**: 90+ on all categories

---

## 📱 Social Media Preview Testing

### Facebook Sharing Debugger
**URL**: https://developers.facebook.com/tools/debug/

**What it tests**: Open Graph tags, social preview image
**Test URLs**:
- https://tools.dennislysenko.tech/ (generic image)
- https://tools.dennislysenko.tech/screenshot-resizer (tool-specific)

**How to use**:
1. Enter URL
2. Click "Debug"
3. Check preview image displays
4. Click "Scrape Again" if you updated tags

**Expected**:
- og:image shows correctly (1200×630)
- og:title and og:description display
- No warnings

---

### Twitter Card Validator
**URL**: ~~https://cards-dev.twitter.com/validator~~ (Currently unavailable)

**Status**: ⚠️ Twitter/X has deprecated this tool

**Alternative Testing Methods**:
1. **Post a test tweet** with your URL (use private/test account)
2. **Use Facebook Debugger** - Twitter honors Open Graph tags
3. **Check meta tags manually**:
   ```bash
   curl -s https://tools.dennislysenko.tech/screenshot-resizer | grep "twitter:"
   ```

**Required Twitter Card tags** (verify these exist):
- `twitter:card` → "summary_large_image"
- `twitter:title` → Your page title
- `twitter:description` → Your description
- `twitter:image` → Your OG image URL

---

### LinkedIn Post Inspector
**URL**: https://www.linkedin.com/post-inspector/

**What it tests**: LinkedIn sharing preview
**How to use**:
1. Enter URL
2. Click "Inspect"
3. Review preview

**Expected**: Image, title, and description render correctly

---

## 🗺️ Sitemap & Robots Testing

### Robots.txt Tester
**URL**: https://technicalseo.com/tools/robots-txt/

**What it tests**: robots.txt syntax and rules
**Test**: https://tools.dennislysenko.tech/robots.txt

**Expected**:
- Valid syntax
- Sitemap directive present
- No accidental blocks

---

### XML Sitemap Validator
**URL**: https://www.xml-sitemaps.com/validate-xml-sitemap.html

**What it tests**: Sitemap structure and validity
**Test**: https://tools.dennislysenko.tech/sitemap-index.xml

**Expected**:
- Valid XML
- All URLs absolute (HTTPS)
- No broken links

---

### Direct Access Tests
Check these URLs directly in your browser:

```
https://tools.dennislysenko.tech/robots.txt
https://tools.dennislysenko.tech/sitemap-index.xml
https://tools.dennislysenko.tech/sitemap-0.xml
```

---

## 🔐 Search Engine Webmaster Tools

### Google Search Console ⭐ REQUIRED
**URL**: https://search.google.com/search-console

**Setup**:
1. Add property: `https://tools.dennislysenko.tech`
2. Verify ownership (DNS or HTML file)
3. Submit sitemap: `https://tools.dennislysenko.tech/sitemap-index.xml`

**Monitor**:
- Index coverage
- Search queries
- Core Web Vitals
- Mobile usability
- Crawl errors

---

### Bing Webmaster Tools
**URL**: https://www.bing.com/webmasters

**Why**: Bing powers ~30% of US searches + DuckDuckGo + Yahoo

**Setup**:
1. Add site
2. Verify ownership
3. Submit sitemap

---

## 📊 Testing Checklist

Use this checklist after deployment:

### Immediate (Within 5 minutes)
- [ ] robots.txt accessible
- [ ] sitemap-index.xml accessible
- [ ] Google Rich Results Test - PASS
- [ ] Facebook Debugger - image displays
- [ ] Twitter Card - preview shows
- [ ] LinkedIn Inspector - preview shows

### Within 1 hour
- [ ] PageSpeed Insights - 90+ scores
- [ ] Mobile-Friendly Test - PASS
- [ ] Lighthouse audit - 90+ SEO score
- [ ] Schema.org Validator - no errors

### Within 1 week
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify indexing started (Search Console)

### Monthly
- [ ] Review Search Console for errors
- [ ] Check Core Web Vitals trends
- [ ] Monitor search query performance
- [ ] Update sitemap if tools added

---

## 🚨 Quick Command-Line Tests

### Check robots.txt
```bash
curl https://tools.dennislysenko.tech/robots.txt
```

### Check sitemap
```bash
curl https://tools.dennislysenko.tech/sitemap-index.xml
```

### Check meta tags
```bash
curl -s https://tools.dennislysenko.tech/screenshot-resizer | grep -i "meta property=\"og:"
```

### Check JSON-LD
```bash
curl -s https://tools.dennislysenko.tech/screenshot-resizer | grep -A 30 "application/ld+json"
```

### Check response headers
```bash
curl -I https://tools.dennislysenko.tech
```

---

## 📱 Browser Extension Testing

### SEO Meta in 1 Click (Chrome)
**URL**: Search "SEO Meta in 1 Click" in Chrome Web Store

**What it shows**: All meta tags on current page

**Quick check**:
1. Install extension
2. Visit your page
3. Click extension icon
4. Review all meta tags instantly

---

## ✅ Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Rich Results Test | ✅ SoftwareApplication schema valid |
| Schema Validator | ✅ No errors |
| PageSpeed Mobile | 🎯 90+ score |
| PageSpeed Desktop | 🎯 90+ score |
| Mobile-Friendly | ✅ Pass |
| Facebook Debugger | ✅ Image displays, no warnings |
| Twitter Card | ✅ Preview shows correctly |
| LinkedIn Inspector | ✅ Preview renders |
| Lighthouse SEO | 🎯 95-100 |
| robots.txt | ✅ Accessible |
| Sitemap | ✅ Valid XML, all pages listed |

---

## 🔧 Troubleshooting

### Issue: Facebook shows old/wrong image
**Solution**: Use "Scrape Again" button in Facebook Debugger

### Issue: Twitter Card not showing
**Solution**: Verify you have twitter:card meta tag, requires dev account to validate

### Issue: Rich Results Test shows errors
**Solution**: Validate JSON-LD at schema.org validator, check for syntax errors

### Issue: Sitemap not found (404)
**Solution**: Rebuild site (`npm run build`), verify @astrojs/sitemap is installed

---

**Last Updated**: 2025-12-25
