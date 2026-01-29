
Goals
- Update social previews: replace current OpenGraph/Twitter image with Orion Atlas branded images (banner + square).
- Improve navigation UX: add a global Back button in the Navbar (on all pages except Home).
- Refresh Home page design: add new sections for “Bots + Websites”, “E-commerce”, and “Everything else”, with clear CTAs into the product.
- Minor consistency fixes: ensure Orion Atlas name appears consistently (ex: Auth page currently says “BotForge”).

Scope decisions (based on your answers)
- OpenGraph/Twitter meta tags will use relative URLs (ex: /og-image.png).
- Back button will be global in Navbar (with history back; fallback to Home).
- Home page will include all 3 new sections now.
- We will generate both social images (banner + square), and use the banner as the primary OG/Twitter image.

Implementation plan

1) Create new brand social assets (banner + square)
- Generate two images:
  - Banner: 1200×630 (social preview standard). Background: matching site gradient, Orion Atlas icon, short tagline.
  - Square: 1024×1024 (re-usable logo tile; can be used for other meta tags later).
- Add them to the project’s public assets so they’re available at:
  - /og-image.png (banner)
  - /og-square.png (square)
- Ensure safe margins so the logo/text isn’t cropped in link unfurls.

2) Update index.html OpenGraph + Twitter meta tags
- Replace existing og:image/twitter:image URLs with the new banner:
  - og:image = /og-image.png
  - twitter:image = /og-image.png
- Add recommended metadata for better rendering:
  - og:image:width = 1200
  - og:image:height = 630
  - og:image:alt = “Orion Atlas”
  - twitter:card already set to summary_large_image (keep)
- Keep title/description already aligned with Orion Atlas.

3) Add a global Back button in Navbar
- Update src/components/Navbar.tsx:
  - Detect current route via useLocation().
  - If not on “/”, render a small back button (ArrowLeft) before the brand mark.
  - On click:
    - If browser history length suggests there is a page to go back to, navigate(-1).
    - Otherwise navigate("/") as a fallback.
- Ensure this works on:
  - Desktop navbar
  - Mobile sheet menu layout (back button stays in top bar; sheet still works)

4) Home page redesign: add 3 new sections (Bots+Websites, E-commerce, Everything else)
A) Create new section components (to keep Index.tsx clean)
- Create components under src/components/, for example:
  - HomeSolutions.tsx (Bots + Websites section)
  - HomeEcommerce.tsx (E-commerce section)
  - HomeMore.tsx (Everything else section)
- Each section will:
  - Use the existing visual language (motion + cards + gradients).
  - Provide 2–3 “feature cards” with an icon, title, and short description.
  - Include clear CTA buttons.

B) Wire sections into src/pages/Index.tsx with anchor IDs
- Update Index.tsx to include:
  - <div id="solutions">…Bots + Websites…</div>
  - <div id="ecommerce">…E-commerce…</div>
  - <div id="more">…Everything else…</div>
- Keep existing sections (Hero, Features, PlatformGrid) but reorder for a stronger story:
  - Hero
  - Solutions (Bots + Websites)
  - E-commerce
  - Features
  - Deploy Everywhere (PlatformGrid)
  - Everything else
- Add a final CTA strip at the bottom (optional but recommended): “Start building with Orion Atlas” with buttons to /ai-chat and /platforms.

C) Define CTAs to existing pages (no dead ends)
- Bots + Websites section CTAs:
  - “Create a bot” → /ai-chat or /platforms
  - “Manage bots” → /bots
  - “Templates” → /templates
  - If “Websites” implies storefront/landing pages: link to /storefront (see step 5) or to an explanation section.
- E-commerce section CTAs:
  - “Open Storefront” → /storefront
  - “E-commerce bot” → /ai-chat (with suggested prompt helper text in UI later)
  - Optional: link to Integrations if Shopify setup is required.
- Everything else section CTAs:
  - “Integrations” → /integrations
  - “AI Chat” → /ai-chat
  - “Templates” → /templates
  - (If Analytics page exists and is routed, add; currently src/pages/Analytics.tsx exists but is not routed.)

5) Ensure E-commerce routes exist (so Home CTAs work)
- Update src/App.tsx to include routes for:
  - /storefront → src/pages/Storefront.tsx
  - /product/:handle → src/pages/ProductDetail.tsx
- Verify Navbar has an “E-commerce” link (either anchor on Home or direct /storefront). Recommended:
  - Add “E-commerce” to navbar as “/#ecommerce” (for marketing section) AND optionally a “Storefront” item (direct) if you want it prominent.

6) Fix remaining “BotForge” branding leakage
- Update src/pages/Auth.tsx:
  - Replace “Welcome to BotForge” with “Welcome to Orion Atlas”.
  - Ensure any other mentions of BotForge are removed.
- Quick scan for “BotForge” occurrences and replace with Orion Atlas where user-facing.

7) QA checklist (end-to-end)
- Social preview:
  - Confirm index.html references new images.
  - Confirm images exist in public and load at /og-image.png and /og-square.png in preview.
- Navbar:
  - Back button appears on all non-home pages.
  - Back button works even when first entry is direct link (falls back to Home).
  - Mobile menu still opens/closes normally.
- Home page:
  - Navbar anchor links scroll to the correct sections (solutions/ecommerce/more/features/platforms).
  - All CTAs navigate to valid routes (no 404).
- E-commerce:
  - /storefront and /product/:handle routes load (even if Shopify data isn’t configured, the pages should render and show error states gracefully).

Technical notes / risks
- Social platforms cache OG images aggressively; after publishing, you may need to “force re-scrape” using platform tools (Facebook Sharing Debugger, etc.).
- Relative OG image URLs are fine once your site is publicly accessible; they won’t work correctly if the URL isn’t reachable by the crawler.
- Shopify storefront token/domain are currently hardcoded in src/lib/shopify.ts; this is not part of your request, but for production we should move those to environment variables later.

Files expected to change (implementation phase)
- index.html (OG/Twitter meta tags)
- public/og-image.png (new)
- public/og-square.png (new)
- src/components/Navbar.tsx (global back button + nav updates)
- src/pages/Index.tsx (new sections + layout)
- src/components/(new Home sections).tsx (new)
- src/App.tsx (add Storefront + ProductDetail routes)
- src/pages/Auth.tsx (BotForge → Orion Atlas text)

Definition of done
- Sharing the site shows Orion Atlas branded social preview image (banner).
- Home page has the requested sections and looks cohesive with current theme.
- Users can navigate forward/back smoothly; back button is always available off Home.
- E-commerce links work (storefront + product detail routes accessible).
