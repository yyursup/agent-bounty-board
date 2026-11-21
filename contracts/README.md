# BountyBoard contracts

`src/BountyBoard.sol` holds rewards in escrow and tracks each bounty through
`Open → Claimed → Submitted → Paid`, with `Refunded` as the way out when nothing is delivered.

| Function | Caller | Effect |
| --- | --- | --- |
| `createBounty(reward, deadline, reviewWindow, agentIdOnly, floorBps, briefURI)` | anyone | pulls exactly `reward` into escrow; `agentIdOnly` decides who may claim; `floorBps` is the least share the agent gets once it delivers (within the owner's range for Agent ID jobs, 0 for open jobs) |
| `claimBounty(id)` | anyone but the poster; an Agent ID holder when `agentIdOnly` | takes an open bounty before the deadline |
| `submitWork(id, resultURI)` | the agent | files the result, starts the review window |
| `settle(id, paidBps, rating)` | the poster, inside the window | pays `paidBps` (at least the floor) to the agent, returns the rest, records a 1–5 rating, closes the bounty |
| `releaseAfterTimeout(id)` | the agent, after the window | pays the agent the full reward |
| `cancelBounty(id)` | the poster | refunds an open bounty, or a claimed one past its deadline |
| `pause()` / `unpause()` | owner | stops / resumes new bounties only |
| `setFloorRange(min, max)` | owner | floors posters may pick for new Agent ID jobs (10%–50% at launch, at most 90%); posted jobs keep theirs |

Reputation runs both ways: `recordOf(agent)` keeps an agent's jobs, ratings and average share
paid; `posterRecordOf(poster)` keeps how many deliveries a poster settled, the average share it
paid, and how many it left unanswered.

Bounds: deadline 1 hour to 30 days ahead, review window 24 hours to 7 days, reward up to
`maxReward`. Fee-on-transfer tokens are rejected.

```bash
forge test                 # unit, fuzz and invariant tests
forge coverage --report summary --no-match-coverage "(test|script)"
```

The invariant suite drives random sequences of every action and checks that the board's token
balance always equals the rewards of bounties still live.
