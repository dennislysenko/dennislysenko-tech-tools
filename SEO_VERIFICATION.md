# SEO Verification Tools & Methods

## Quick Verification Checklist

After deploying your SEO updates, use these tools to verify everything is working correctly:

✅ Meta tags are rendering correctly
✅ Structured data (JSON-LD) is valid
✅ Sitemap is accessible and valid
✅ Robots.txt is working
✅ Social preview images display correctly
✅ Page loads fast (Core Web Vitals)
✅ Mobile-friendly
✅ No critical SEO issues

---

## Essential Free SEO Tools

### 1. Google Search Console (Most Important)
**URL**: https://search.google.com/search-console

**Purpose**: Official Google tool for monitoring search performance

**Setup**:
1. Sign in with Google account
2. Add property: `https://tools.dennislysenko.tech`
3. Verify ownership (DNS TXT record or HTML file method)
4. Submit sitemap: `https://tools.dennislysenko.tech/sitemap-index.xml`

**What to Check**:
- ✅ Sitemap status (submitted and indexed pages)
- ✅ Coverage issues (errors, warnings)
- ✅ Core Web Vitals (performance metrics)
- ✅ Mobile usability issues
- ✅ Index status
- ✅ Search queries and impressions (after a few weeks)

**Frequency**: Check weekly initially, then monthly

---

### 2. Google Rich Results Test
**URL**: https://search.google.com/test/rich-results

**Purpose**: Validate structured data (JSON-LD schema)

**How to Use**:
1. Enter URL: `https://tools.dennislysenko.tech/screenshot-resizer`
2. Click "Test URL"
3. Review detected structured data

**What to Look For**:
- ✅ "Page is eligible for rich results" message
- ✅ SoftwareApplication schema detected
- ✅ No errors or warnings
- ✅ All required fields present (name, description, offers, author)

**Expected Result**: Should detect `SoftwareApplication` schema with all properties

---

### 3. Schema.org Validator
**URL**: https://validator.schema.org/

**Purpose**: Comprehensive structured data validation

**How to Use**:
1. Paste your page URL
2. Or paste the JSON-LD code directly
3. Review validation results

**What to Check**:
- ✅ No errors in JSON-LD syntax
- ✅ All @type definitions are valid
- ✅ Required properties for each schema type
- ✅ Warnings (optional properties)

---

### 4. PageSpeed Insights (Core Web Vitals)
**URL**: https://pagespeed.web.dev/

**Purpose**: Measure page performance and SEO impact

**How to Use**:
1. Enter URL: `https://tools.dennislysenko.tech`
2. Run analysis
3. Review both Mobile and Desktop scores

**Target Scores**:
- Performance: 90+ (green)
- Accessibility: 90+ (green)
- Best Practices: 90+ (green)
- SEO: 90+ (green)

**Key Metrics (Core Web Vitals)**:
- **LCP** (Largest Contentful Paint): < 2.5s (good)
- **FID** (First Input Delay): < 100ms (good)
- **CLS** (Cumulative Layout Shift): < 0.1 (good)

**Fix Common Issues**:
- Optimize images (use WebP, compress)
- Minimize JavaScript
- Reduce unused CSS
- Enable text compression
- Serve images with correct dimensions

---

### 5. Mobile-Friendly Test
**URL**: https://search.google.com/test/mobile-friendly

**Purpose**: Verify mobile usability (important for mobile-first indexing)

**How to Use**:
1. Enter URL
2. Run test
3. Review results

**What to Check**:
- ✅ "Page is mobile-friendly" confirmation
- ✅ No text too small to read
- ✅ No content wider than screen
- ✅ Links not too close together
- ✅ Viewport meta tag detected

---

### 6. Facebook Sharing Debugger
**URL**: https://developers.facebook.com/tools/debug/

**Purpose**: Test Open Graph (OG) tags and preview how links appear on Facebook

**How to Use**:
1. Enter URL: `https://tools.dennislysenko.tech`
2. Click "Debug"
3. Review OG tags and preview

**What to Verify**:
- ✅ og:title displays correctly
- ✅ og:description shows full text
- ✅ og:image loads (1200×630 px)
- ✅ og:url is correct
- ✅ Preview looks professional

**Note**: Use "Scrape Again" button if you update OG tags

---

### 7. Twitter Card Validator
**URL**: https://cards-dev.twitter.com/validator

**Purpose**: Validate Twitter Card meta tags

**How to Use**:
1. Enter URL
2. Click "Preview card"
3. Review preview

**What to Check**:
- ✅ twitter:card type (summary_large_image)
- ✅ twitter:title displays
- ✅ twitter:description displays
- ✅ twitter:image loads correctly
- ✅ Preview looks good on desktop and mobile

**Note**: Requires Twitter/X developer account (free)

---

### 8. LinkedIn Post Inspector
**URL**: https://www.linkedin.com/post-inspector/

**Purpose**: Test how your link appears on LinkedIn

**How to Use**:
1. Enter URL
2. Click "Inspect"
3. Review preview

**What to Verify**:
- ✅ Title, description, and image render correctly
- ✅ Image is clear and professional
- ✅ No formatting issues

---

### 9. Sitemap Validator
**URL**: https://www.xml-sitemaps.com/validate-xml-sitemap.html

**Purpose**: Validate sitemap.xml syntax and structure

**How to Use**:
1. Enter sitemap URL: `https://tools.dennislysenko.tech/sitemap-index.xml`
2. Validate
3. Review any errors

**What to Check**:
- ✅ Valid XML syntax
- ✅ All URLs are absolute (not relative)
- ✅ All URLs use HTTPS
- ✅ No broken links
- ✅ Lastmod dates are recent

**Manual Test**:
```bash
# Visit directly in browser
https://tools.dennislysenko.tech/sitemap-index.xml

# Should show XML structure with all pages
```

---

### 10. Robots.txt Tester
**URL**: https://technicalseo.com/tools/robots-txt/

**Purpose**: Validate robots.txt syntax and test blocking rules

**How to Use**:
1. Enter robots.txt URL: `https://tools.dennislysenko.tech/robots.txt`
2. Test specific user-agents
3. Verify Allow/Disallow rules

**What to Check**:
- ✅ Sitemap directive points to correct URL
- ✅ No syntax errors
- ✅ User-agent: * is set correctly
- ✅ Important pages are not accidentally blocked

**Manual Test**:
```bash
# Visit directly
https://tools.dennislysenko.tech/robots.txt

# Should display plain text with sitemap URL
```

---

## Browser-Based SEO Auditing

### 11. Lighthouse (Built into Chrome DevTools)
**Access**: Chrome DevTools → Lighthouse tab

**How to Use**:
1. Open Chrome DevTools (F12)
2. Click "Lighthouse" tab
3. Select categories: Performance, Accessibility, Best Practices, SEO
4. Choose device: Mobile or Desktop
5. Click "Analyze page load"

**What to Review**:
- ✅ SEO score (aim for 100)
- ✅ Meta description present
- ✅ Document has a title
- ✅ Links have descriptive text
- ✅ Image alt attributes
- ✅ Valid robots.txt and sitemap.xml
- ✅ Canonical URL set

**Actionable Feedback**: Lighthouse provides specific recommendations for each issue

---

### 12. SEO Meta Inspector (Browser Extension)
**Chrome**: https://chrome.google.com/webstore (search "SEO Meta in 1 Click")

**Purpose**: Quick view of all meta tags on a page

**How to Use**:
1. Install extension
2. Visit your page
3. Click extension icon
4. Review all meta tags

**What to Check**:
- ✅ Title tag (50-60 characters)
- ✅ Meta description (150-160 characters)
- ✅ Meta keywords
- ✅ Canonical URL
- ✅ OG tags
- ✅ Twitter Card tags
- ✅ Structured data

---

## SEO Monitoring Tools (Post-Launch)

### 13. Google Analytics 4 (GA4)
**URL**: https://analytics.google.com/

**Setup**:
1. Create GA4 property
2. Add tracking code to Layout.astro
3. Monitor traffic sources

**Metrics to Track**:
- Organic search traffic
- Bounce rate
- Average session duration
- Top landing pages
- Search queries (via Search Console integration)

---

### 14. Bing Webmaster Tools
**URL**: https://www.bing.com/webmasters

**Why Use**: Bing powers ~30% of US searches (+ DuckDuckGo, Yahoo)

**Setup**:
1. Sign up with Microsoft account
2. Add site
3. Submit sitemap
4. Verify ownership

**What to Monitor**:
- Index status
- Crawl errors
- Keyword rankings (Bing perspective)

---

## Command-Line SEO Checks

### Check robots.txt
```bash
curl https://tools.dennislysenko.tech/robots.txt
```

### Check sitemap
```bash
curl https://tools.dennislysenko.tech/sitemap-index.xml
```

### Test meta tags (using curl + grep)
```bash
curl -s https://tools.dennislysenko.tech/screenshot-resizer | grep -i "meta name"
```

### Check structured data
```bash
curl -s https://tools.dennislysenko.tech/screenshot-resizer | grep -A 50 "application/ld+json"
```

### Check response headers
```bash
curl -I https://tools.dennislysenko.tech
```

---

## Verification Schedule

### Immediately After Deployment
- [ ] Robots.txt accessible
- [ ] Sitemap XML valid
- [ ] Rich Results Test passes
- [ ] Facebook Debugger shows correct preview
- [ ] Twitter Card displays correctly
- [ ] Lighthouse SEO score 90+
- [ ] Mobile-Friendly Test passes
- [ ] PageSpeed Insights scores good

### Within 1 Week
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify indexing has started (Search Console)

### Weekly (First Month)
- [ ] Check Search Console for errors
- [ ] Monitor indexing progress
- [ ] Review Core Web Vitals
- [ ] Check for crawl errors

### Monthly (Ongoing)
- [ ] Review search query performance
- [ ] Check backlinks (if any)
- [ ] Monitor Core Web Vitals trends
- [ ] Update sitemap if new tools added
- [ ] Review and update meta descriptions based on CTR

---

## Common SEO Issues & Fixes

### Issue: OG image not displaying
**Cause**: Image URL incorrect, or cache
**Fix**:
1. Verify image exists at /public/og-image.jpg
2. Use absolute URL in meta tag
3. Clear cache in Facebook Debugger

### Issue: Sitemap not found (404)
**Cause**: Build didn't generate sitemap
**Fix**:
1. Verify @astrojs/sitemap is installed
2. Check astro.config.mjs has sitemap integration
3. Rebuild and redeploy

### Issue: Low SEO score in Lighthouse
**Cause**: Missing meta tags, poor accessibility
**Fix**:
1. Review Lighthouse recommendations
2. Add missing meta description
3. Ensure all images have alt text
4. Add descriptive link text

### Issue: Structured data errors
**Cause**: Invalid JSON-LD syntax
**Fix**:
1. Validate JSON-LD with Schema.org validator
2. Check for missing required properties
3. Ensure proper escaping of special characters

---

## SEO Health Score Summary

Based on implemented changes, your expected scores:

| Tool | Expected Score | Target |
|------|---------------|--------|
| Lighthouse SEO | 95-100 | 100 |
| PageSpeed Mobile | 85-95 | 90+ |
| PageSpeed Desktop | 90-100 | 90+ |
| Google Rich Results | ✅ Valid | Valid |
| Mobile-Friendly | ✅ Pass | Pass |
| Schema Validator | ✅ No Errors | No Errors |

---

## Next Steps

1. **Deploy** your changes to production
2. **Verify** using the tools above (complete the checklist)
3. **Submit** sitemap to Google Search Console
4. **Monitor** indexing progress over next 2-4 weeks
5. **Optimize** based on real user data and search console insights

---

## Additional Resources

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo)
- [Ahrefs SEO Checklist](https://ahrefs.com/seo/checklist)
- [web.dev SEO Audits](https://web.dev/learn/seo/)

---

**Questions or Issues?** If any verification tool reports errors, review the corresponding section in this guide for troubleshooting steps.
