
Goal
- Make Orion Atlas feel “cinematic”: distinctive, modern, consistent, and high-end across every page.
- Upgrade the AI experience so it’s noticeably more capable, more reliable, and easier to use to create bots, storefronts, templates, and “everything else”.
- Add practical testing (automated where possible + a clear manual QA checklist) to confirm nothing breaks.

What I found in your codebase (important context)
- The UI is already using Tailwind + shadcn/ui + Framer Motion, with a dark theme + gradient utilities (`gradient-primary`, `text-gradient`) defined in `src/index.css`.
- Each page renders `<Navbar />` and then its own layout. The styling quality varies per page, and many pages have repeated “page header” patterns.
- You already have AI streaming on:
  - `/ai-chat` (AI builder) via `supabase/functions/ai-chat`
  - bot customization chat via `supabase/functions/bot-chat`
- AI currently enforces “final JSON in a fenced block” (client tries to parse it). This is functional but brittle.
- The home page now has the requested sections (Bots+Websites, E-commerce, Everything else), but the overall “cinematic” vibe isn’t applied globally.

Scope (what will change)
1) Global Design System Upgrade (cinematic theme)
2) Page-by-page polish using shared layout building blocks (so everything looks consistent)
3) Stronger “Create” flows (bots / storefront / templates / integrations) so the product feels like a cohesive studio
4) AI upgrades (better default model, better structure, more reliable outputs, more power features)
5) Testing and verification (Vitest + manual QA runbook)

Non-goals (to keep this controlled)
- No backend business logic changes to Shopify beyond UI/UX polish (we won’t change your Shopify token/domain wiring in this pass).
- No new paid AI provider setup; we’ll keep your current hybrid approach (Lovable AI Gateway for Gemini/GPT + OpenRouter for Qwen) but improve how it’s used.

Phase 1 — Cinematic design foundation (global)
A) Introduce a shared “App Shell” / “Page Shell”
- Create a reusable layout wrapper that every page uses:
  - Consistent top padding (navbar offset)
  - Max-width container rules
  - Shared background “cinematic layers”
  - Shared page header pattern (title, subtitle, optional actions)
- This removes repeated boilerplate and guarantees consistency.

B) Cinematic background system (reusable, performant)
- Add an `OrionBackground` component:
  - Gradient mesh base
  - Subtle animated “nebula blobs” (Framer Motion or CSS keyframes)
  - Light “starfield” or particle layer (very low CPU: static star dots + slow drift)
  - Optional subtle noise overlay (CSS background image pattern or lightweight SVG)
- Add “glass” surfaces for cards:
  - Slight transparency + backdrop-blur
  - Consistent border highlights and hover glow

C) Expand Tailwind animation utilities (so cinematic effects are everywhere)
- Extend `tailwind.config.ts` animations to include:
  - fade-in / fade-out
  - scale-in / scale-out
  - slide-in-right / slide-out-right
  - gentle float / shimmer / glow pulse
- Add utility classes in `src/index.css`:
  - `.glass-panel`, `.glow-border`, `.orion-grid`, `.orion-noise`, `.cinematic-shadow`
  - A consistent “interactive hover” standard across all cards/buttons

D) Consistent typography + spacing scale
- Normalize page titles (H1), section titles (H2), and subtitles across all pages.
- Standardize card spacing and grid breakpoints for a “premium” look.

Files involved (Phase 1)
- `tailwind.config.ts` (new keyframes/animations)
- `src/index.css` (new reusable classes for glass/glow/noise)
- New reusable components (planned):
  - `src/components/layout/PageShell.tsx`
  - `src/components/layout/PageHeader.tsx`
  - `src/components/visual/OrionBackground.tsx`

Phase 2 — Navbar & navigation feel “premium”
A) Navbar polish
- Keep your global back button, but refine behavior:
  - Only show “Back” if not on `/`
  - Improve fallback logic: if history length is small OR previous route is external, go to `/`
  - Add a subtle “active state” for current route
  - Improve mobile sheet styling (glass panel + animated entrance)
- Improve anchor navigation:
  - When clicking “/#section”, smooth scroll if already on home
  - If not on home, navigate to home then smooth scroll after route transition

B) Primary CTA behavior (Get Started)
- Make “Get Started” actually route to the best next step:
  - If not signed in → `/auth`
  - If signed in → new “Create” hub (see Phase 3)

Files involved (Phase 2)
- `src/components/Navbar.tsx`
- Potential small hook helper:
  - `src/hooks/useSmoothHashScroll.ts` (or equivalent)

Phase 3 — Make “Create bots, stores, and everything else” feel like a studio
A) Add a “Create Hub” page (central command)
- New route: `/create`
- 3 big cinematic tiles/cards:
  1) Create a Bot (→ `/ai-chat` or `/platforms`)
  2) Create a Storefront (→ `/storefront`)
  3) Create Templates + Copy (→ `/templates`)
  4) (Optional tile) Connect Integrations (→ `/integrations`)
- Each tile:
  - Micro-animations on hover (glow + slight parallax)
  - “What you’ll get” bullet list
  - One clear CTA

B) Improve onboarding flow
- After sign-in, route to `/create` (instead of always `/`)
- Home page remains marketing; `/create` becomes product entry for building.

C) Update Home page sections to match the new studio
- Add stronger CTAs:
  - “Open Orion Studio” → `/create`
  - “AI Builder” → `/ai-chat`
  - “Storefront” → `/storefront`
- Add subtle cinematic section separators (gradient divider lines, animated accent)

Files involved (Phase 3)
- `src/App.tsx` (add `/create` route)
- New page:
  - `src/pages/Create.tsx`
- `src/pages/Index.tsx` + Home section components polish (existing)
- `src/pages/Auth.tsx` redirect destination update after login

Phase 4 — Page-by-page redesign pass (consistent, modern, cinematic)
We’ll apply PageShell/PageHeader + cinematic background everywhere, then improve each page’s UX:

A) `/auth`
- Keep the current layout (it’s already strong), but:
  - Ensure perfect consistency with the new global background and glass panels
  - Improve button hierarchy and loading feedback micro-interactions
  - Add a “Why Orion Atlas” mini section (short, premium, not noisy)

B) `/platforms`
- Convert platform cards into a premium “select and continue” flow:
  - Make “Get Started” actually navigate to `/customize?platform=...` (currently it’s a button with no action)
  - Add filters/search by category
  - Improve card visuals: glow border, consistent icon tiles, hover lift, reveal animation

C) `/bots`
- Make it feel like a dashboard:
  - Better empty state with “Create bot” + “Import template”
  - Improve deployment dialog visuals and copy
  - Add clear “Next step” actions prevents confusion (Customize, Deploy, Analytics)

D) `/customize`
- Remove duplicate back button (you already have global back in navbar; the per-page ArrowLeft can be removed or repurposed)
- Upgrade to a “studio layout”:
  - Left: chat + AI tools tabs
  - Right: preview panel in a glass frame
  - Add top summary chips (platform, bot type, last saved)
  - Add better save states (saving… / saved / error)

E) `/templates`
- Improve template editor UX:
  - Better preview modal styling
  - Variable chips + quick fill
  - More premium dialog layout and animation
  - Add “Generate with AI” as a first-class experience (not hidden)

F) `/integrations`
- Improve clarity and reduce anxiety:
  - Step-by-step “Connect → Verify → Deploy”
  - Better status visualization (timeline style)
  - More cinematic cards but calm, enterprise feel

G) `/storefront` + `/product/:handle`
- Upgrade storefront visuals:
  - Add category-like filtering (even if it’s simple)
  - Add product skeleton loading
  - Improve product cards (image hover zoom is good; we’ll add consistent overlays and better spacing)
  - Ensure cart interactions feel premium (drawer transitions, empty state)

H) `/analytics` (exists but not routed)
- Add route `/analytics` and a per-bot “View analytics” CTA from bots list.
- Apply design system and improve readability of charts with consistent card styling.
- Keep charts but refine layout and empty states.

Files involved (Phase 4)
- `src/pages/Platforms.tsx`
- `src/pages/Bots.tsx`
- `src/pages/Customize.tsx`
- `src/pages/ResponseTemplates.tsx`
- `src/pages/Integrations.tsx`
- `src/pages/Storefront.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/Analytics.tsx`
- `src/App.tsx` (add `/analytics`)
- Shared layout components introduced in Phase 1

Phase 5 — Make AI “more powerful” (practical upgrades)
A) Better default model + clearer intent routing
- Default AI Builder model should be a strong generalist:
  - Switch default from `qwen/qwen3-coder:free` to `google/gemini-3-flash-preview` (fast, high quality)
  - Keep Qwen as an option

B) Increase reliability of structured outputs
Right now the AI is told to print JSON in a fenced block, and the client tries to parse it.
Upgrade this to be more robust:
- For Lovable AI Gateway models (Gemini/GPT):
  - Use tool calling (function schema) in the edge function so we get guaranteed structured output (no broken JSON).
- For OpenRouter Qwen:
  - Keep the “final fenced JSON” approach, but improve:
    - Add server-side validation and auto-repair attempt if JSON is malformed
    - Always end stream with a clean final JSON block

C) “Orion Atlas Builder” prompt improvements
- Strengthen system prompt to:
  - Ask at most 1 clarifying question only when absolutely needed
  - Produce: short plan + outputs
  - Generate higher quality templates (more realistic, better variables, better tone)
  - Add “website/storefront suggestions” when user intent is e-commerce or “website”

D) UX upgrades in AI Chat UI
- Add:
  - Stop/Cancel generation (AbortController)
  - Regenerate last response
  - “Use plan” flow improvements: show plan summary cards (Bot / Brand / Templates / Copy)
  - Model description tooltip (“fast / best quality / cheapest”)
  - Stronger error surfaces (402/429) with actionable messages

E) Make bot customization chat smarter (bot-chat)
- Pull more bot context:
  - bot_type, platform, response templates (if available), brand (if linked)
- Improve system prompt so the assistant:
  - Suggests changes that match the platform (WhatsApp vs Telegram)
  - Uses templates when available
  - Produces “diff-style” updates when modifying personality/greeting (so it’s easier to review)

Files involved (Phase 5)
- `src/pages/AiChat.tsx` (UX upgrades, new controls, better plan rendering)
- `src/lib/streamAiChat.ts` (AbortController support, error handling improvements)
- `supabase/functions/ai-chat/index.ts` (tool calling for structured output when supported; better validation)
- `src/components/BotChatInterface.tsx` (similar UX improvements if needed)
- `src/lib/streamChat.ts` (AbortController support)
- `supabase/functions/bot-chat/index.ts` (more context, better prompt)

Phase 6 — Testing & “verify everything works”
A) Automated tests (Vitest + Testing Library)
Add/expand tests to cover critical UI interactions:
- Navbar:
  - Back button renders on non-home routes
  - Clicking back falls back to home when history is shallow
- Routing:
  - `/create`, `/storefront`, `/templates`, `/ai-chat` render without crashing
- AI utilities:
  - “extractVariables” behavior
  - JSON plan parsing behavior (unit-level)

Files involved
- `src/test/` new tests, e.g.:
  - `src/components/Navbar.test.tsx`
  - `src/pages/Create.test.tsx`
  - small utility tests

B) Manual QA checklist (run end-to-end in preview)
We’ll follow a click-by-click checklist:
1) Auth:
   - Sign in, sign up, Google sign-in (if configured), redirect works
2) Create hub:
   - All CTAs route correctly
3) AI Chat:
   - Send prompt, stop generation, regenerate, create bot/templates works
4) Bots:
   - List loads, customize works, deploy dialog works, delete works
5) Customize:
   - Chat works, save works, preview updates
6) Templates:
   - Create template, preview template, AI suggestions flow works
7) Integrations:
   - Status refresh works, save works, verify works
8) Storefront:
   - Products load, product detail loads, add to cart works

Dependencies / sequencing
- Must implement Phase 1 first (design foundation) because all other page work depends on it.
- AI structured output improvements should be staged:
  1) UI improvements (cancel/regenerate)
  2) Edge function tool calling + validation
  3) Better prompts/context

Risks & mitigations
- Performance risk from heavy animations:
  - Use subtle, low-layer backgrounds; avoid many moving particles.
  - Respect “prefers-reduced-motion”.
- Social/OG images caching:
  - Already handled; unrelated to this pass.
- AI tool calling compatibility:
  - Use tool calling only where supported (Lovable AI Gateway models), fallback gracefully for OpenRouter.

Definition of done
- Every page shares a cohesive cinematic theme (background, typography, spacing, card style).
- Navigation feels premium and consistent (anchors smooth scroll, back button behavior is reliable).
- There is a clear “Create” entry point for bots, storefront, templates, and integrations.
- AI Chat is more capable and easier to use (stop/regenerate, more reliable structured outputs).
- A clear test suite + manual QA checklist exists and is executed in preview without major issues.