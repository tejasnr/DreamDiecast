# AI Search Readiness Implementation Checklist

## Phase 1: Critical Fixes (Week 1) - 2 Hours Total

### 1. Add robots.txt (15 minutes) - HIGHEST PRIORITY
- [ ] Copy `robots.txt.template` to `/public/robots.txt`
- [ ] Update sitemap URL if needed
- [ ] Deploy to production
- [ ] Verify at https://dreamdiecast.in/robots.txt
- **Expected Impact:** +10 points | Makes site discoverable by ChatGPT, Perplexity, Claude

### 2. Add llms.txt (30 minutes)
- [ ] Copy `llms.txt.template` to `/public/llms.txt`
- [ ] Update founding date if known
- [ ] Add any missing product categories
- [ ] Deploy to production
- [ ] Verify at https://dreamdiecast.in/llms.txt
- **Expected Impact:** +8 points | Helps AI systems understand site structure

### 3. Add Organization Schema to Homepage (1 hour)
- [ ] Open `app/layout.tsx` or homepage component
- [ ] Copy JSON from `schema-organization.json`
- [ ] Add to `<head>` section:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(organizationSchema)
  }}
/>
```
- [ ] Update logo URL (upload logo to /public if needed)
- [ ] Deploy and test with Google Rich Results Test
- **Expected Impact:** +5 points | Makes company info machine-readable

### 4. Verify Sitemap Exists (15 minutes)
- [ ] Check if https://dreamdiecast.in/sitemap.xml works
- [ ] If missing, create `app/sitemap.ts` (Next.js auto-generates)
- [ ] Submit sitemap to Google Search Console
- **Expected Impact:** +2 points | Helps crawlers discover all pages

**Phase 1 Total Expected Score: 42 → 67 (+25 points)**

---

## Phase 2: High-Impact Content (Weeks 2-4) - 10-15 Hours

### 5. Create FAQ Page (3 hours)
- [ ] Create `/app/faq/page.tsx`
- [ ] Write 15 common questions with detailed answers:
  - How long does shipping take?
  - Are models authentic?
  - What is your return policy?
  - Which brands do you sell?
  - How do I verify authenticity?
  - What do scale numbers mean (1:18, 1:24, etc.)?
  - Do you ship internationally?
  - How do you package models?
  - What payment methods do you accept?
  - How can I track my order?
  - Do you offer gift wrapping?
  - Can I pre-order upcoming releases?
  - What if my model arrives damaged?
  - Do you have a physical store?
  - How often do you add new models?
- [ ] Add FAQPage schema markup
- [ ] Link from footer navigation
- **Expected Impact:** +7 points | Triggers Google AI Overviews

### 6. Add Publication Dates to All Pages (1 hour)
- [ ] Add "Last updated: [date]" to About page
- [ ] Add "Last updated: [date]" to all policy pages
- [ ] Add "Published: [date]" byline to homepage intro (if added)
- **Expected Impact:** +3 points | Signals content freshness

### 7. Enhance About Page (2 hours)
- [ ] Add founding year/date
- [ ] Add founder names (if willing to share)
- [ ] Add specific statistics:
  - Number of customers served
  - Number of models in stock
  - Number of brand partnerships
  - Years in business
- [ ] Restructure with clear sections:
  - Our Story (with timeline)
  - Mission & Values
  - Authentication Process
  - Meet the Team (optional)
- [ ] Add author byline
- **Expected Impact:** +4 points | Builds authority signals

### 8. Add Homepage Intro Text (1 hour)
- [ ] Add 150-word introduction above product grid
- [ ] Include key facts: location, brands, inventory size, delivery time
- [ ] Make it citable: "DreamDiecast is Bangalore's leading..."
- **Expected Impact:** +3 points | Provides AI systems with quotable intro

### 9. Implement Breadcrumb Navigation (3 hours)
- [ ] Create `<Breadcrumbs>` component
- [ ] Add to all product pages
- [ ] Add BreadcrumbList schema
- [ ] Test on mobile and desktop
- **Expected Impact:** +3 points | Improves structural clarity

**Phase 2 Total Expected Score: 67 → 87 (+20 points)**

---

## Phase 3: Authority Building (Months 2-3) - 20-40 Hours

### 10. Launch YouTube Channel (20-30 hours)
- [ ] Create channel: @DreamDiecastOfficial
- [ ] Record 5 initial videos:
  1. "How to Authenticate Diecast Models" (5 min)
  2. "Hot Wheels vs. Mini GT Comparison" (8 min)
  3. "Unboxing Rare [Product]" (4 min)
  4. "Our Authentication Process" (6 min)
  5. "Top 10 JDM Diecast Models 2026" (10 min)
- [ ] Optimize titles, descriptions, tags
- [ ] Add channel link to homepage footer
- [ ] Embed videos on About page
- **Expected Impact:** +15 points | Strongest brand signal (0.737 correlation)

### 11. Create Blog with 3 Ultimate Guides (10-15 hours)
- [ ] Set up `/blog` route
- [ ] Write 3 comprehensive guides (1,500-2,000 words each):
  1. "Ultimate Guide to Diecast Collecting in India (2026)"
  2. "How to Spot Fake Diecast Models: Complete Guide"
  3. "Diecast Scale Guide: 1:18 vs 1:24 vs 1:43 vs 1:64"
- [ ] Add Article schema to each post
- [ ] Link from homepage
- **Expected Impact:** +8 points | Creates citable long-form content

### 12. Add Product Schema to Product Pages (3-5 hours)
- [ ] Create Product schema template
- [ ] Add to all product pages dynamically
- [ ] Include: name, price, availability, brand, image, description
- [ ] Add AggregateRating if you have reviews
- [ ] Test with Google Rich Results Test
- **Expected Impact:** +5 points | Makes products machine-readable

### 13. Build Reddit Presence (2-3 hours/month ongoing)
- [ ] Join r/Diecast, r/HotWheels, r/Diecast_Exchange
- [ ] Post 2-3 times per month with valuable content
- [ ] Engage authentically with community
- [ ] Add "DreamDiecast founder" flair
- **Expected Impact:** +3 points | Builds brand mentions

**Phase 3 Total Expected Score: 87 → 94+ (+7+ points)**

---

## Maintenance (Ongoing)

### Monthly Tasks
- [ ] Upload 2 new YouTube videos
- [ ] Write 1-2 blog posts
- [ ] Update llms.txt with new content
- [ ] Engage on Reddit (5-10 posts/comments)
- [ ] Monitor AI citations (manual searches)

### Quarterly Tasks
- [ ] Review and update FAQ page
- [ ] Update "Last modified" dates on policy pages
- [ ] Audit schema markup for errors
- [ ] Check Google Search Console for AI crawler access
- [ ] Measure GEO score improvements

### Annual Tasks
- [ ] Comprehensive content audit
- [ ] Refresh Ultimate Guides with new data
- [ ] Update statistics on About page
- [ ] Evaluate new AI platforms (emerging search engines)

---

## Quick Wins (Can Do Today)

1. **robots.txt** - 15 minutes, +10 points
2. **llms.txt** - 30 minutes, +8 points
3. **Add dates to pages** - 30 minutes, +3 points
4. **Homepage intro text** - 45 minutes, +3 points

**Total: 2 hours for +24 points (42 → 66)**

---

## Tools & Resources

### Free Testing Tools
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/
- PageSpeed Insights: https://pagespeedinsights.web.dev/
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

### Monitoring
- Google Search Console (free)
- Bing Webmaster Tools (free)
- Manual AI searches (ChatGPT, Perplexity, Google)

### Learning Resources
- Schema.org documentation: https://schema.org/
- Google Search Central: https://developers.google.com/search
- Next.js SEO docs: https://nextjs.org/docs/app/building-your-application/optimizing/metadata

---

## Success Metrics

Track these monthly:
- [ ] AI citations count (manual searches)
- [ ] Organic traffic from AI-powered search
- [ ] YouTube subscribers & views
- [ ] Blog post traffic
- [ ] Schema markup errors (GSC)
- [ ] Indexed pages count

**Target: 80+ GEO score within 3 months**

---

## Questions?

If you need help implementing any of these:
1. Check the main report: `ai-search-readiness.md`
2. Refer to Next.js documentation for technical implementation
3. Test changes in development before deploying

**Remember:** robots.txt and llms.txt are the highest-priority, lowest-effort fixes. Start there!
