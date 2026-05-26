# LegalConnect NG Launch-Ready Marketplace V1 Design

## Status

Approved direction: build a real launch-ready legal marketplace, not a demo-only product.

Launch V1 monetization starts with lawyer-side plans and visibility tools. Paid client consultations are deferred to V1.5 after marketplace trust, booking, moderation, payments, refunds, disputes, and service expectations are more mature.

## Product Goal

LegalConnect NG should launch as a credible Nigerian legal marketplace with an X-style professional social layer. Clients should be able to discover lawyers, inspect profiles, read legal insights, and initiate contact or booking intent. Lawyers should be able to onboard, build trust, post legal content, get verified, receive leads, and upgrade for better visibility and growth tools.

The product must be strong enough for public users, lawyer forum onboarding, investor review, and partner conversations while remaining practical to operate as a V1 business.

## Hard Constraints

- Preserve the current X/Twitter-style layout and interaction language.
- Treat the existing deployed GitHub repo `Bukassi600104/Legal-Connect` and Vercel deployment `https://legal-connect-beige.vercel.app/` as production surfaces.
- The Firebase project is already connected and should be handled as a real backend.
- Prioritize stability, security, auth, admin, payment correctness, and public marketplace conversion before adding broad new social features.
- Next.js 16 local docs are authoritative for framework conventions.

## Current Baseline

The codebase is a Next.js 16.2.6 / React 19 app using Firebase Auth, Firestore, Firebase Storage, Firebase Admin, Paystack, Tailwind 4, shadcn components, and lucide icons.

Observed live-site issues:

- `/explore` redirects to login, blocking public marketplace discovery.
- `/pricing` redirects to login, blocking lawyer monetization discovery.
- `/terms`, `/privacy`, `/cookies`, and `/help` return 404.
- Homepage is responsive and clean but reads more like a landing page than an active marketplace.
- Build warns that `middleware` is deprecated in Next 16 and should become `proxy`.
- `npm run lint` currently fails with React 19/Next lint errors.

## V1 User Model

### Public Visitor

Can browse the marketplace, inspect lawyer profiles, view public legal content, understand pricing, and learn how verification works. Must sign up only when attempting high-intent actions.

### Client User

Can create an account, browse lawyers, message/contact lawyers, send booking intent, bookmark posts/profiles, follow lawyers, participate in legal feed interactions, and manage their own consultations or leads.

### Lawyer User

Can create a lawyer account, complete profile details, submit verification, publish legal content, receive messages and booking intent, track leads, upgrade to paid plans, and build visible authority.

### Admin User

Can review verification requests, moderate users/content, inspect subscriptions, manage user status, and handle marketplace trust operations.

## Public And Gated Route Strategy

Public routes:

- `/`
- `/explore`
- `/pricing`
- `/lawyer/[slug]`
- `/profile/[handle]` with public-safe data
- `/hashtag/[tag]`
- `/feed` in public read-only or preview mode
- `/terms`
- `/privacy`
- `/cookies`
- `/help`
- `/verification-info`

Authenticated routes:

- `/messages`
- `/bookmarks`
- `/consultations`
- `/settings`
- `/dashboard/*`
- `/client-dashboard`
- `/admin/*`
- feed compose, like, comment, repost/share, bookmark, follow, and poll voting actions
- lawyer contact and booking intent actions

The rule is: browsing is public; actions that create state, expose private data, or start a business workflow require authentication.

## Marketplace Core

### Lawyer Discovery

`/explore` should become the main marketplace entry point. It should support:

- Search by name, handle, bio, state, city, and specialization.
- Filters for state, specialization, verification status, availability, rating, and plan tier.
- Lawyer cards that show name, avatar, handle, location, specialization, verification badge, subscription tier badge, rating, years of experience, fee range where available, and primary CTA.
- Premium placement that is transparent and not misleading.
- Empty states that guide users to broader filters or signup.

### Lawyer Profiles

Public lawyer profiles should include:

- Identity, avatar/banner, handle, location, verification state, premium tier, specializations, languages, years of experience, SCN/NBA details where appropriate, bio, fee range, availability, rating/reviews, recent legal posts, and CTA.
- Gated CTAs for message/contact/book.
- Clear verification explanation and trust indicators.
- Safety copy that LegalConnect is a marketplace and does not itself provide legal advice.

### Client Discovery Flow

Clients should be able to:

- Browse lawyers before signup.
- Open profile pages from search/feed.
- Start contact or booking intent after signup.
- View their message and consultation/lead history.

## X-Style Legal Network

The social layer should help lawyers build authority and help clients learn, not become a generic social clone.

V1 social features:

- Public/legal feed with read-only visitor mode.
- Authenticated posting.
- Comments, likes, bookmarks, follows, hashtags.
- Threads and polls where already present, stabilized behind clean lint/runtime behavior.
- Notifications for key events.
- Legal categories and hashtag discovery.

V1 should not overbuild algorithmic ranking. Use simple, explainable ranking first: recent, followed, category, boosted/featured, and verified/premium signals.

## Monetization

Launch V1 monetizes lawyers first.

Free lawyer tier:

- Public profile.
- Basic discovery listing.
- Limited monthly posts/media.
- Basic contact/booking intent.

Professional tier:

- Verified/premium prominence where eligible.
- Priority listing boost.
- More or unlimited posts.
- Richer media limits.
- Basic analytics.
- Lead-management enhancements.

Elite tier:

- Featured placement.
- Stronger search/listing boost.
- Boosted posts.
- Custom profile URL or enhanced profile controls.
- Priority support.
- Advanced analytics.

Paystack must validate plan, billing cycle, and amount server-side. Client-provided amount must not be trusted. Subscription updates must be idempotent and store references needed for cancellation and reconciliation.

## Security And Trust

### Auth

- Keep Firebase Auth and session cookies.
- Harden session recovery and sign-out behavior.
- Ensure route protection uses Next 16 `proxy.ts`.
- Avoid relying only on client-side role checks for sensitive flows.

### Firestore Rules

Rules should enforce:

- Users can only mutate their own profile except admin-managed fields.
- Handles cannot be hijacked.
- Messages are readable/writable only by conversation participants.
- Notifications are private to the recipient.
- Verification review and subscription status changes are admin/server-only.
- Hashtag and counter writes cannot be abused where possible.
- Admin operations require admin role.

### Admin

Admin screens should remain hidden from non-admin users, but server/rules enforcement must be the source of truth.

### Legal Trust Pages

Add production-appropriate:

- Terms of service.
- Privacy policy.
- Cookie notice.
- Help/support page.
- Verification policy.
- Legal disclaimer that platform content is informational and does not automatically create a lawyer-client relationship.

## Technical Architecture

### Next.js

- Migrate `src/middleware.ts` to `src/proxy.ts` per Next.js 16 docs.
- Keep app router conventions.
- Prefer server route handlers for sensitive operations.
- Keep interactive surfaces as client components where needed, but avoid unnecessary full-page client boundaries over time.

### Firebase

- Client SDK handles public reads and user-owned interactions where rules allow.
- Admin SDK handles privileged routes: auth session, account deletion, payment webhooks, admin mutations where added.
- Firestore indexes should be maintained with deployment scripts.

### Paystack

- Use subscriptions only for lawyer plans in V1.
- Server validates plan IDs and amounts.
- Webhook verifies signature.
- Webhook handles duplicate events safely.
- Store transaction reference, customer code, subscription code when available, plan, billing cycle, status, period dates, and lawyer ID.

## UX/UI Direction

- Preserve X-style navigation, feed density, sidebars, bottom nav, rounded action buttons, and social interaction patterns.
- Make public marketplace browsing feel less locked down.
- Keep lawyer profile and discovery surfaces more marketplace-like: searchable, filterable, trust-heavy, CTA-driven.
- Improve mobile flows for browse, profile, contact intent, signup, and dashboard.
- Avoid decorative redesign that makes operational workflows harder.

## Implementation Phases

### Phase 1: Stability And Framework Compliance

- Fix all lint errors.
- Migrate middleware to proxy.
- Ensure build completes without framework warnings.
- Clean high-signal warnings where low-risk.

Acceptance:

- `npm run lint` passes.
- `npm run build` passes.
- Protected redirects still work.
- Public routes remain reachable.

### Phase 2: Public Marketplace And Trust Pages

- Make `/explore`, `/pricing`, public profiles, hashtags, and feed preview accessible without auth.
- Add legal/trust pages.
- Update nav/CTA behavior for public visitors.

Acceptance:

- Visitors can browse lawyers and pricing without login.
- High-intent actions still redirect to login with a return path.
- Footer links no longer 404.

### Phase 3: Security Hardening

- Review and tighten Firestore rules.
- Move sensitive writes to server routes where needed.
- Harden admin access and role behavior.
- Harden handle, message, notification, verification, subscription, and payment flows.

Acceptance:

- Non-participants cannot read private messages.
- Non-admins cannot perform admin writes.
- Client cannot tamper with paid plan amount or subscription tier.
- Existing user-owned flows still work.

### Phase 4: Marketplace UX Improvements

- Improve lawyer cards, filters, profile pages, empty states, and CTAs.
- Add public verification information.
- Improve onboarding completion prompts for lawyers.

Acceptance:

- A new visitor can understand the product, browse lawyers, open a profile, and know what to do next.
- A lawyer can understand why to join and how paid plans help them.

### Phase 5: Lawyer Monetization

- Clean pricing tiers.
- Validate Paystack initialization server-side.
- Improve subscription callback/webhook state.
- Reflect tier benefits in discovery/profile/feed.

Acceptance:

- Lawyer subscriptions can be initiated safely.
- Subscription status updates lawyer visibility and tier display.
- Admin can inspect subscriptions.

### Phase 6: Launch QA

- Responsive QA on mobile/tablet/desktop.
- Browser QA of public, client, lawyer, and admin flows.
- Seed credible marketplace data for early launch if production data is thin.
- SEO, robots, sitemap, metadata, and share previews.

Acceptance:

- Core launch flows work end-to-end.
- No known 404s from primary navigation/footer.
- No console-breaking errors on critical pages.

## Explicit Non-Goals For V1

- Paid client consultations inside the platform.
- Lawyer payouts.
- Escrow, refunds, and dispute handling for client payments.
- Complex recommendation algorithms.
- Full legal case management.
- AI legal advice.

## V1.5 Candidates

- Paid consultations.
- Lawyer payouts and invoices.
- Client premium features.
- Advanced analytics.
- Organization/law-firm accounts.
- Document intake and paid document review.
- Stronger moderation workflows and audit logs.

## V1 Defaults

- Public feed shows posts from active users, with ranking/visual trust favoring verified lawyers, premium lawyers, followed accounts, and recent legal categories.
- Unverified lawyers can complete profiles and post, but marketplace contact and booking-intent CTAs should favor verified lawyers. If an unverified lawyer is shown, the UI must clearly indicate verification status.
- Lawyer contact starts with authenticated messaging as the primary CTA. Booking intent is the secondary CTA and does not collect payment in V1.
- Professional and Elite pricing should begin with the existing plan values unless the business owner changes them before launch: Professional at NGN 15,000 monthly / NGN 144,000 yearly, Elite at NGN 35,000 monthly / NGN 336,000 yearly.
- Trust pages should ship with clear production draft copy and be reviewed by Nigerian counsel before broad public launch.
