

## Product direction captured
You want to **expand the current app** with a lot of features, prioritizing:
1) **Advanced analytics**  
2) **Platform setup UI** (integrations/credentials + testing)  
3) **Teams & RBAC**  
4) **Billing & plans**  
…and you want **enterprise-grade webhook/message reliability**, while **keeping AI behavior as-is** (OpenRouter stays, mainly prompts/templates improvements only).

This plan breaks work into safe, incremental milestones so the app remains usable and testable after each step.

---

## Milestone 0 — Stabilize + establish “feature delivery rails” (fast, 1–2 sessions)
### Goals
- Reduce risk before adding many features.
- Make it easy to ship features without breaking core flows.

### Work
- **Fix current React ref warning** (“Function components cannot be given refs”) by finding the component(s) receiving a ref and updating to `forwardRef` where needed (common with Radix `asChild` patterns).
- Add a simple **Error Boundary** at the app shell level + toast reporting so runtime errors surface clearly.
- Add a lightweight **/debug** page (internal) showing:
  - Supabase connectivity status
  - Auth session state
  - Edge function health check calls (bot-chat, conversation-analytics)
- Add a repeatable **E2E smoke checklist** (documented in README or /debug) covering:
  - Navigation: /, /platforms, /bots, /customize, /templates, /analytics, /auth
  - One bot create + customize + deploy record creation
  - One template create + preview
  - Analytics page load for a bot

### Definition of done
- No ref warnings in console during core navigation.
- /debug shows green for the basics.
- Your requested E2E checks pass in preview.

---

## Milestone 1 — Platform Setup UI (credentials, verification, test message) (core priority)
You already have a `platform_integrations` table in types, plus many webhook edge functions. What’s missing is a unified place in the UI to configure and validate platform connections.

### Goals
- A single “Integrations” experience to connect platforms safely.
- Credentials stored server-side with RLS; client never leaks secrets.
- Ability to **test** that a platform integration works before deploying.

### Work (Frontend)
- Create a new route/page: **/integrations** (or extend /platforms with “Connect” actions).
- Add an “Integration Card” flow per platform:
  1) **Connect** (capture required fields like tokens/webhook secret)
  2) **Save** (writes to `platform_integrations`)
  3) **Verify/Test** (calls an edge function to validate credentials)
  4) **Status** (Connected / Invalid / Needs attention)
- Show integration status on **/platforms** and in **Bots Deploy** modal.

### Work (Backend / Security)
- Ensure **RLS** on `platform_integrations` only allows owners to read/write their rows.
- If credentials are sensitive (they are), avoid direct client reads:
  - Preferred pattern: store credentials in DB, but **do not expose them to the client**.
  - Implement a **view** that excludes sensitive fields, or enforce policies that prevent selecting `credentials` except via edge functions.
- Add an edge function: **integration-verify**:
  - Input: platform + integration id
  - Validates payload using `zod`-style checks (server-side validation)
  - Performs a lightweight API call for that platform (where possible)
  - Stores verification results (status + timestamp + non-sensitive error reason)

### Definition of done
- User can connect at least 2 platforms end-to-end (e.g., WhatsApp + Telegram placeholders/real if you have credentials).
- “Verify” gives clear success/failure messaging.
- No credentials are shown in the UI after saving.

---

## Milestone 2 — Enterprise-grade webhook/message reliability (idempotency, logging, retries, rate limiting)
Right now webhooks are likely “process immediately or fail”. Enterprise-grade requires observability + safe reprocessing.

### Goals
- Never double-process the same webhook event.
- Record every inbound/outbound attempt.
- Retry failed sends safely with backoff.
- Protect against bursts (rate limiting).

### Work (Database)
Add tables (schema changes) for reliability:
- `webhook_events` (raw inbound event metadata, platform event id, received_at, payload_hash, status)
- `message_jobs` (normalized jobs to process/respond, state machine: queued/processing/succeeded/failed, attempts, next_retry_at)
- `message_job_logs` (append-only logs for each attempt; safe debugging)
- Optional: `platform_rate_limits` configuration per platform (requests/minute)

### Work (Edge functions)
- Standardize each webhook function to:
  1) Verify signature (platform-specific)
  2) Compute **idempotency key** (platform message id or payload hash)
  3) Insert/Upsert into `webhook_events` (if exists → return 200 early)
  4) Create a `message_job`
  5) Process job (synchronously for now) and update job status
- Add `job-retry` edge function:
  - Finds due failed jobs (`next_retry_at <= now()`)
  - Re-attempts safely with max attempt limit
  - Applies exponential backoff
  - This can be triggered manually from the UI initially; later you can automate it using Supabase scheduled triggers/cron if available in your environment.

### Work (UI)
- Add an “Operations” section:
  - Failed jobs queue
  - Retry button
  - Search by bot/platform/event id
  - Download logs (redacted)

### Definition of done
- Duplicate webhook deliveries do not create duplicate bot responses.
- Failed jobs are visible and retryable.
- Clear audit trail exists for troubleshooting.

---

## Milestone 3 — Teams & RBAC (organizations, roles table, policies)
You already have auth + profiles. Next is multi-user teams with strict security.

### Goals
- Invite team members to an “organization/workspace” inside the app (not Lovable workspace).
- Proper RBAC without privilege escalation.

### Work (Database)
- Create `app_role` enum and `user_roles` table (separate from profiles; critical).
- Add `organizations`, `organization_members` tables:
  - membership role: owner/admin/member
- Add a `has_role()` / `is_org_admin()` **security definer** function to avoid recursive RLS.
- Update key tables (`bots`, `deployments`, `templates`, `analytics`) to support org ownership:
  - Either `org_id` or a shared access model.

### Work (UI)
- Organization switcher in Navbar.
- Team management page:
  - Invite by email (invites table + accept flow)
  - Role management (admin/member)

### Definition of done
- Two users can collaborate on the same org’s bots/templates safely.
- A non-admin cannot access admin-only pages via URL.
- RLS prevents cross-org data leakage.

---

## Milestone 4 — Billing & plans (Stripe) + usage limits
### Goals
- Monetize: Free/Pro/Business tiers.
- Enforce limits aligned to plans (bots count, messages, analytics runs, integrations).

### Work
- Enable Stripe integration (Lovable tool) and implement:
  - Checkout (subscription)
  - Customer portal
  - Webhook handling for subscription state
- Add a plan/entitlements layer:
  - `entitlements` computed from Stripe subscription
  - Usage tracking tables (messages processed, analytics runs, etc.)
  - Guardrails in UI and edge functions:
    - Block create bot/integration if over limit
    - Block heavy analytics if plan disallows

### Definition of done
- User can subscribe, app reflects plan state, limits are enforced server-side.

---

## Milestone 5 — Advanced analytics (funnels, exports, platform breakdown, AI summaries)
You already have `conversation_sessions/messages` + `conversation_insights` and a conversation-analytics edge function.

### Goals
- Make analytics actionable and “SaaS-grade”.

### Work
- Add segmentation:
  - By platform, deployment, template usage, timeframe
- Add export:
  - CSV export for events/sessions/messages (respect RLS)
- Add dashboards:
  - Funnel metrics (e.g., first contact → resolved → conversion event)
  - Time-to-first-response, resolution rate, satisfaction
- Improve insights generation UX:
  - Save “analysis runs” (inputs + outputs)
  - Trend lines over time

### Definition of done
- Analytics page can filter by date/platform and export.
- Insight runs are stored and comparable over time.

---

## Sequencing recommendation (so you can ship fast without breaking things)
1) Milestone 0 (stability + debug)  
2) Milestone 1 (Platform setup UI)  
3) Milestone 2 (Reliability & ops)  
4) Milestone 3 (Teams & RBAC)  
5) Milestone 4 (Billing & plans)  
6) Milestone 5 (Advanced analytics)

Reason: integrations + reliability are the foundation; teams/billing/analytics build on that foundation.

---

## Testing plan (what we will repeatedly test end-to-end)
After each milestone:
- Navigation through all primary routes
- Auth flows (sign up/sign in/sign out)
- Bot create → customize → deploy
- Platform integration connect → verify
- Webhook simulation (where possible) → job created → response generated
- Console + network error sweep (no red errors)

---

## Technical notes (how it fits your codebase)
- Frontend: React Router routes in `src/App.tsx`; we’ll add new pages following existing `pages/*.tsx` pattern and reuse shadcn/ui components.
- Data fetching: TanStack Query patterns already used (`Bots.tsx`, `ResponseTemplates.tsx`)—we’ll standardize new pages on this.
- Backend: Supabase Edge Functions already exist per platform; we’ll consolidate shared logic in `supabase/functions/_shared/*` to reduce duplication.
- Security: RLS-first design; sensitive secrets never exposed client-side; roles stored in separate table only.

