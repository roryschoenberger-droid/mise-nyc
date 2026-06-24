# Check-in progress tracker

**Type:** AFK
**Status:** ready
**Blocked by:** 03

## What to build

For DINES-type challenges in "My Challenges", show a live progress bar indicating how many unique diner check-ins have been recorded toward the threshold. Pull check-in data from Flynet's List Check-ins endpoint filtered by the restaurant, count check-ins that fall within the challenge's start/end window, and display "X / threshold check-ins" with a progress bar. Refresh on page load (no polling needed).

**Scope note:** This slice is progress-tracking ONLY. It does NOT issue any reward. When a challenge hits 100%, show a "Ready to reward" state but do NOT call the Issue a reward endpoint — that is slice 06. No real $FLY moves in this slice.

## Acceptance criteria

- [ ] DINES challenge cards show a progress bar (X / threshold)
- [ ] Check-in count pulled from Flynet API (List Check-ins) filtered by date window
- [ ] Progress bar fills proportionally to threshold
- [ ] Non-DINES challenges show no progress bar
- [ ] Graceful fallback if Flynet check-in API is unavailable (show "—" not an error)
