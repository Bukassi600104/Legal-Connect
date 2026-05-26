# Phase 1 Stability And Framework Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current LegalConnect NG app pass lint/build on Next.js 16 and React 19 while preserving existing product behavior and X-style UI.

**Architecture:** Treat `npm run lint` as the red baseline for React 19 lint failures, then make narrow behavior-preserving edits. Migrate deprecated Next.js middleware to the `proxy.ts` convention from local Next 16 docs. Verify with lint, build, and route-level checks.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, ESLint 9, Firebase, Firestore, Paystack, Tailwind 4.

---

### Task 1: Capture Baseline And Next 16 Proxy Rule

**Files:**
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- Read: `src/middleware.ts`
- Run: `npm run lint`

- [ ] **Step 1: Confirm the Next 16 proxy convention**

Run:

```powershell
Get-Content -Path node_modules\next\dist\docs\01-app\01-getting-started\16-proxy.md -TotalCount 120
```

Expected: documentation says Middleware is now called Proxy, and projects should create `proxy.ts` in the project root or inside `src`.

- [ ] **Step 2: Run lint to verify the red baseline**

Run:

```powershell
npm run lint
```

Expected: FAIL with existing React lint errors, including `react-hooks/set-state-in-effect`, `react-hooks/immutability`, `react-hooks/purity`, `react/no-unescaped-entities`, and `@typescript-eslint/no-explicit-any`.

### Task 2: Migrate Middleware To Proxy

**Files:**
- Create: `src/proxy.ts`
- Delete: `src/middleware.ts`

- [ ] **Step 1: Move the current middleware logic into `src/proxy.ts`**

Create `src/proxy.ts` with this shape:

```ts
import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  const protectedPaths = [
    "/messages",
    "/consultations",
    "/dashboard",
    "/client-dashboard",
    "/admin",
    "/settings",
    "/bookmarks",
  ];

  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const authPaths = ["/login", "/signup"];
  const isAuthRoute = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthRoute && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/|api/).*)"],
};
```

This intentionally removes `/feed`, `/explore`, and `/pricing` from protected paths so public marketplace discovery can begin in Phase 2 without fighting proxy behavior.

- [ ] **Step 2: Delete `src/middleware.ts`**

Run:

```powershell
Remove-Item -LiteralPath src\middleware.ts
```

Expected: only `src/proxy.ts` remains as the request proxy convention.

### Task 3: Fix React 19 Lint Errors

**Files:**
- Modify: `src/app/(main)/admin/moderation/page.tsx`
- Modify: `src/app/(main)/admin/subscriptions/page.tsx`
- Modify: `src/app/(main)/admin/verification/page.tsx`
- Modify: `src/app/(main)/bookmarks/page.tsx`
- Modify: `src/app/(main)/client-dashboard/page.tsx`
- Modify: `src/app/(main)/consultations/page.tsx`
- Modify: `src/app/(main)/consultations/[consultationId]/review/page.tsx`
- Modify: `src/app/(main)/dashboard/posts/page.tsx`
- Modify: `src/app/(main)/dashboard/subscription/callback/page.tsx`
- Modify: `src/app/(main)/dashboard/verification/page.tsx`
- Modify: `src/app/(main)/feed/page.tsx`
- Modify: `src/app/(main)/messages/page.tsx`
- Modify: `src/app/(main)/messages/[conversationId]/page.tsx`
- Modify: `src/app/(main)/profile/[handle]/page.tsx`
- Modify: `src/app/(main)/settings/page.tsx`
- Modify: `src/components/feed/poll-creator.tsx`
- Modify: `src/components/feed/poll-display.tsx`

- [ ] **Step 1: Fix functions referenced before declaration**

For each page where an effect calls a function declared later, convert the fetch function to `useCallback` declared before the effect, then include it in the dependency array.

Example pattern:

```tsx
const fetchRequests = useCallback(async () => {
  setLoading(true);
  try {
    // existing fetch body
  } finally {
    setLoading(false);
  }
}, [filter]);

useEffect(() => {
  void fetchRequests();
}, [fetchRequests]);
```

- [ ] **Step 2: Fix synchronous `setState` in effects**

Where an effect does this:

```tsx
if (!user) {
  setLoading(false);
  return;
}
```

replace the render guard with derived loading/auth UI when possible:

```tsx
const isPageLoading = authLoading || (user ? loading : false);

if (isPageLoading) return <PageLoader />;
if (!user) return <EmptyState ... />;
```

Where an async effect is still needed, move `setLoading(false)` into an async callback or snapshot callback rather than the synchronous effect body.

- [ ] **Step 3: Fix render purity errors**

For `poll-creator`, move poll payload creation into event handlers or an effect driven by state changes instead of calling `Date.now()` during render-driven computation.

For `poll-display`, keep a `now` state value initialized lazily with `useState(() => Date.now())`, update it with an interval in `useEffect`, and use that value in render calculations.

- [ ] **Step 4: Fix profile page escaping and timestamp type**

Replace unescaped apostrophes with `&apos;` or text expressions, and replace `any` timestamp handling with a narrow type guard:

```ts
function toDateValue(value: Timestamp | string | undefined): Date {
  if (!value) return new Date();
  if (typeof value === "string") return new Date(value);
  return value.toDate?.() ?? new Date();
}
```

### Task 4: Verify Stability

**Files:**
- Run: `npm run lint`
- Run: `npm run build`

- [ ] **Step 1: Run lint**

Run:

```powershell
npm run lint
```

Expected: exit code 0.

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: exit code 0, no middleware deprecation warning.

- [ ] **Step 3: Smoke test route behavior**

Run the app or inspect deployed/local behavior:

- `/explore` should not be blocked by proxy.
- `/pricing` should not be blocked by proxy.
- `/messages` should redirect unauthenticated users to `/login?redirectTo=/messages`.
- `/dashboard` should redirect unauthenticated users to `/login?redirectTo=/dashboard`.

### Task 5: Logo Direction Notes

**Files:**
- Create: `docs/brand/logo-direction.md`

- [ ] **Step 1: Add practical logo guidance**

Create a short brand note covering:

- Recommended symbol directions: scale + connection, legal brief/message, LC monogram with subtle scales.
- Avoid: generic courthouse, gavels as the primary mark, overly complex seals, tiny unreadable details.
- Required deliverables from a designer: SVG, PNG, favicon, social avatar, light/dark variants, one-color mark.
- Usage constraints: must fit 24px nav, app icon, social avatar, and premium/investor materials.

### Task 6: Commit Phase 1 Foundation

**Files:**
- Stage only files changed for Phase 1.

- [ ] **Step 1: Review diff**

Run:

```powershell
git diff --stat
git diff -- src\proxy.ts src\middleware.ts docs\brand\logo-direction.md
```

- [ ] **Step 2: Commit after verification passes**

Run:

```powershell
git add -- src docs
git commit -m "chore: stabilize next 16 foundation"
```

Expected: commit succeeds after lint/build verification.
