# Dashboard shell

**Type:** AFK
**Status:** ready
**Blocked by:** None — can start immediately

## What to build

Replace the existing homepage with a clean, authenticated dashboard shell. Unauthenticated users see a full-screen sign-in card with the Blackbird logo and a "Sign in with Blackbird" button. Authenticated users see a two-section dashboard layout: "My Challenges" (left/top) and "Market Challenges" (right/bottom), both empty with placeholder states for now. Keep the dev drawer, middleware, auth routes, and proxy untouched.

## Acceptance criteria

- [ ] Unauthenticated visit to `/` shows sign-in screen with "Sign in with Blackbird" button
- [ ] Authenticated visit to `/` shows dashboard with two empty sections: "My Challenges" and "Market Challenges"
- [ ] Each section has an empty state message (e.g. "No challenges yet")
- [ ] Mobile-friendly layout using existing Blackbird Tailwind tokens
- [ ] Dev drawer still visible and functional
- [ ] All existing auth routes (/api/auth/login, /callback, /api/auth/logout) still work
