# Create and view my challenges

**Type:** AFK
**Status:** ready
**Blocked by:** 01

## What to build

Let a signed-in restaurant manager create a custom challenge and see their own challenges listed on the dashboard. A "New Challenge" button opens a form (modal or drawer) with fields: title, description, challenge type (DINES / PAYMENT), threshold (number), $FLY reward amount, start date, end date. On submit, the challenge is appended to `data/challenges.json` with `source: "restaurant"` and the manager's profile ID as `restaurantId`. The "My Challenges" dashboard section reads and displays their challenges as cards.

## Acceptance criteria

- [ ] "New Challenge" button visible on dashboard when signed in
- [ ] Form collects: title, description, type, threshold, FLY reward, start date, end date
- [ ] Submitted challenge appears immediately in "My Challenges" section
- [ ] Challenges persisted to `data/challenges.json` with `source: "restaurant"`
- [ ] Each challenge card shows title, type badge, threshold, reward, dates, status
- [ ] Form validates required fields before submit
- [ ] Empty state shown when no custom challenges exist yet
