# Challenge Hub — PRD

## Problem Statement

Restaurant managers on the Blackbird network have no dedicated tool to create diner challenges, discover market-wide events, or pay to participate in them — all using $FLY.

## Solution

A restaurant-facing web app built on the flynet-starter that lets managers:
1. Create custom challenges for their own restaurant (e.g. "Dine 3 Tuesdays, earn $50 FLY")
2. Browse market-wide challenges created by Blackbird
3. Pay in $FLY to join a market-wide challenge
4. (Later) See diner progress tracked automatically via Blackbird check-in data

## User Stories

1. As a restaurant manager, I want to sign in with my Blackbird account so I can access my dashboard.
2. As a restaurant manager, I want to see a dashboard that shows my challenges and market-wide opportunities at a glance.
3. As a restaurant manager, I want to create a custom challenge with a title, description, reward in $FLY, and a check-in threshold so my diners have a reason to return.
4. As a restaurant manager, I want to browse Blackbird-created market-wide challenges so I can decide which ones to join.
5. As a restaurant manager, I want to pay in $FLY to join a market-wide challenge so my restaurant appears in that campaign.
6. As a restaurant manager, I want to see diner check-in progress on my DINES challenges so I know how they're performing.

## Implementation Decisions

**Auth:** Keep the existing Token-Mediating Backend pattern unchanged. The dashboard is gated — unauthenticated users see only a sign-in screen.

**Challenge storage (now):** Both market-wide and restaurant-created challenges live in `data/challenges.json`. Market-wide challenges have `source: "blackbird"`. Restaurant-created challenges have `source: "restaurant"` and a `restaurantId`. This mirrors the shape of the Flynet challenges API so the swap to a real DB + API is a find-and-replace.

**Challenge storage (later):** Replace the JSON file with Supabase. No other changes needed.

**Seeded market-wide challenges:**
- 🏆 World Cup Sports Bar Crawl — DINES, threshold 5 sports bars during World Cup matches
- 🍦 Ice Cream Crawl — DINES, threshold 3 ice cream spots in 24 hours

**Payments:** Use the existing `/api/pay` route pattern (create + confirm Payment Intent server-side). Joining a market challenge triggers a $FLY payment.

**Check-in tracking:** Pull from Flynet's List Check-ins endpoint filtered by restaurant. Compare count against challenge threshold. No new infrastructure needed.

**UI:** Mobile-friendly, Blackbird brand tokens (existing Tailwind config). Clean cards, minimal chrome.

## Testing Decisions

- Test the mock data read/write module in isolation (challenge store)
- Test the payment route with a mock Flynet client
- UI: verify key flows render without errors (dashboard, create form, market list)

## Out of Scope

- Diner-facing views (progress, notifications)
- Blackbird admin challenge creation UI (future)
- Real database (Supabase added in a later session)
- Challenge editing or deletion
- Push notifications or email
- Multi-restaurant accounts (one restaurant per login for now)

## Further Notes

The Flynet challenges API is read-only today. Market-wide challenges are seeded locally. When Flynet adds a write endpoint, the `lib/market-challenges.ts` module is the only file that changes.
