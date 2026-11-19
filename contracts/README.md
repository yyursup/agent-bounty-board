# BountyBoard contracts

`src/BountyBoard.sol` holds rewards in escrow and tracks each bounty through
`Open → Claimed → Submitted → Paid`, with `Refunded` as the way out when nothing is delivered.

| Function | Caller | Effect |
| --- | --- | --- |
| `createBounty(reward, deadline, reviewWindow, briefURI)` | Agent ID holder | pulls exactly `reward` into escrow |
| `claimBounty(id)` | Agent ID holder, not the poster | takes an open bounty before the deadline |
| `submitWork(id, resultURI)` | the agent | files the result, starts the review window |
| `approveWork(id, rating)` | the poster | pays the agent, records a 1–5 rating |
| `rejectWork(id)` | the poster, inside the window | reopens the bounty, logs a rejection |
| `releaseAfterTimeout(id)` | the agent, after the window | pays the agent |
| `cancelBounty(id)` | the poster | refunds an open bounty, or a claimed one past its deadline |
| `pause()` / `unpause()` | owner | stops / resumes new bounties only |

Bounds: deadline 1 hour to 30 days ahead, review window 24 hours to 7 days, reward up to
`maxReward`. Fee-on-transfer tokens are rejected.

```bash
forge test                 # unit, fuzz and invariant tests
forge coverage --report summary --no-match-coverage "(test|script)"
```

The invariant suite drives random sequences of every action and checks that the board's token
balance always equals the rewards of bounties still live.
