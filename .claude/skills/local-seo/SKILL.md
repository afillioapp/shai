---
name: local-seo
description: Local search optimization for the Shai Construction site — canonical NAP, per-page meta and Open Graph, GeneralContractor/LocalBusiness JSON-LD, service+city page patterns, heading structure, image alt rules, sitemap and robots. Use when adding or auditing any page, meta tag, or structured data.
---

# Local SEO — Shai Construction

The whole point is ranking for people in York Region searching for a contractor. Technical correctness and NAP consistency do more here than word count.

## Canonical NAP — byte-identical everywhere

```
Shai Construction
58 Kings Cross Ave, Richmond Hill, ON L4B 2S8
416-522-4547
info@shaiconstruction.ca
```

Display phone as `416-522-4547`; link as `tel:+14165224547`. This exact string appears in the footer, the contact page, and the JSON-LD. Any variation ("Kings Cross Avenue", "(416) 522-4547") splits the business's local signal — treat a mismatch as a bug.

## Per-page head block

Every page needs, uniquely:

- `<title>` ≤ 60 chars — primary keyword + city + brand
- `<meta name="description">` 140–160 chars, with a reason to click (not a keyword list)
- `<link rel="canonical">` absolute, no trailing-slash inconsistency
- `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type`, `og:locale=en_CA`, `twitter:card=summary_large_image`
- `<html lang="en-CA">`

Titles for this site:

| Page | Title |
|---|---|
| Home | `Shai Construction \| General Contractor in Richmond Hill` |
| Services | `Construction & Renovation Services \| Richmond Hill, ON` |
| Projects | `Our Work \| Shai Construction Richmond Hill` |
| About | `About Shai Construction \| Building in the GTA Since 2017` |
| Contact | `Contact Shai Construction \| Free Quote, Richmond Hill` |

## Structured data

One `GeneralContractor` block sitewide (in the footer partial or each page's head). Required properties: `name`, `image`, `@id`, `url`, `telephone`, `email`, `address` (`PostalAddress` with `streetAddress`, `addressLocality: "Richmond Hill"`, `addressRegion: "ON"`, `postalCode: "L4B 2S8"`, `addressCountry: "CA"`), `geo`, `foundingDate: "2017"`, `areaServed` (Richmond Hill, Vaughan, Markham, Aurora, Newmarket, North York, Toronto), `priceRange`, and `hasOfferCatalog` listing every service.

**Never emit `aggregateRating` or `review`** — there is no verified review data, and fabricated ratings are a manual-action risk and a legal problem for a real business.

Add `BreadcrumbList` on sub-pages and `ContactPoint` on the contact page. Validate mentally against schema.org before shipping; a JSON-LD syntax error silently voids the whole block.

## Keyword targeting

Primary: `general contractor Richmond Hill`, `home renovation Richmond Hill`, `basement renovation Richmond Hill`, `kitchen renovation GTA`, `pool installation York Region`, `HVAC installation Richmond Hill`, `plumbing contractor Richmond Hill`, `landscaping Richmond Hill`, `commercial contractor GTA`.

Rules: one primary keyword per page in `<h1>` and title. Cities appear naturally in prose and headings — never as a stuffed link list in the footer, which is a recognized spam pattern. Each service gets its own anchored section with a real `<h2>` and 80+ words of specific copy (materials, process, permits), because thin service blurbs do not rank.

## Structure

- Exactly one `<h1>` per page; `<h2>`/`<h3>` in order, never skipping a level, never chosen for size
- Descriptive internal anchor text — "basement renovation services", not "learn more"
- Images: real `alt` describing the work shown, plus `width`/`height`, `loading="lazy"` below the fold, and descriptive filenames (`basement-renovation-richmond-hill.jpg`)
- `sitemap.xml` listing every page with `lastmod`; `robots.txt` allowing all and pointing to the sitemap
- Clean paths (`/services/`, not `/services.html`) where the host supports it; otherwise keep `.html` and stay consistent in every link and canonical

## Conversion signals that also rank

Phone number visible in the header on every page and tappable on mobile. A clear primary CTA above the fold. Service area stated in prose on the homepage. Hours, if provided, in both markup and `openingHoursSpecification`.

## Audit checklist

- [ ] NAP byte-identical in footer, contact page, and JSON-LD
- [ ] Unique title + description + canonical on every page
- [ ] JSON-LD parses, no rating/review properties
- [ ] One `h1`, ordered headings
- [ ] Every image has meaningful alt and explicit dimensions
- [ ] `tel:` link uses `+14165224547`
- [ ] sitemap.xml and robots.txt present and current
- [ ] No invented claims, counts, awards, or testimonials anywhere
