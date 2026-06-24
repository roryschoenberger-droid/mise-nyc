# Market challenges list

**Type:** AFK
**Status:** ready
**Blocked by:** 01

## What to build

Populate the "Market Challenges" section of the dashboard with Blackbird-created challenges read from `data/challenges.json`. Seed the file with two challenges: 🏆 World Cup Sports Bar Crawl (DINES, threshold 5) and 🍦 Ice Cream Crawl (DINES, threshold 3 in 24 hours). Each challenge displays as a card showing title, description, reward in $FLY, dates, and a "Join" button (disabled/greyed for now — wired in slice 04).

## Acceptance criteria

- [ ] `data/challenges.json` seeded with both Blackbird market challenges (`source: "blackbird"`)
- [ ] Market Challenges section shows both challenge cards on the dashboard
- [ ] Each card shows: title, description, $FLY reward, start/end dates, type badge
- [ ] "Join" button visible on each card (can be disabled — payment wired in slice 04)
- [ ] Empty state shown if no market challenges exist
