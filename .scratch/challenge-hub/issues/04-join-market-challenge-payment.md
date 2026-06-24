# Join market challenge with $FLY payment

**Type:** AFK
**Status:** ready
**Blocked by:** 02

## What to build

Wire up the "Join" button on market challenge cards so clicking it triggers a $FLY Payment Intent flow. Use the existing `/api/pay` route pattern (server-side create + confirm). Each market challenge has a `joinFeeFlyWei` field in the seed data. On success, mark the challenge as joined for this restaurant (write a `joinedBy` array to the challenge in `data/challenges.json`). Show a success state on the card ("Joined ✓") after payment confirms. Show an error message if payment fails.

## Acceptance criteria

- [ ] Each market challenge card shows join fee in $FLY
- [ ] "Join" button triggers payment flow using existing Payment Intent pattern
- [ ] Successful payment updates the card to "Joined ✓" state
- [ ] Joined challenges also appear in the "My Challenges" section with a "Market" badge
- [ ] Payment error shown inline if the transaction fails
- [ ] Button disabled / loading state during payment processing
