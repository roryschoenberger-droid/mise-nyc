# Issue reward payout on completion

**Type:** HITL
**Status:** ready
**Blocked by:** 05

## What to build

When a DINES challenge reaches its threshold for a diner, allow the restaurant manager to pay out the challenge's `fly_reward` to that diner using Flynet's "Issue a reward" endpoint (server-side, with `write:rewards` scope and an idempotency key). This is a one-way door — real $FLY moves — so it must be a deliberate, confirmed action, never automatic.

**Why HITL:** This moves real money. The build needs human review of the confirmation flow and a deliberate test before it can pay out. Do NOT auto-issue on threshold crossing.

## Acceptance criteria

- [ ] A completed challenge shows a "Reward diner" button (manual, not automatic)
- [ ] Clicking it shows a confirmation step that names the diner and the exact $FLY amount before anything moves
- [ ] On confirm, calls Issue a reward server-side with an idempotency key (no duplicate payouts on retry)
- [ ] Records that the reward was paid so it cannot be issued twice for the same completion
- [ ] Success and error states shown clearly in the UI
- [ ] No reward is ever issued without an explicit manager confirmation
