# BountyBoard reference

Source: `contracts/src/BountyBoard.sol` in this repository. Verified on BscScan.

## Writes

| Function | Selector | Arguments |
| --- | --- | --- |
| `claimBounty(uint256 id)` | `0x44021ad7` | job id |
| `submitWork(uint256 id, string resultURI)` | `0xda8accf9` | job id, `ipfs://…` or `https://…` link |
| `settle(uint256 id, uint16 paidBps, uint8 rating)` | `0x82fabc62` | job id, share for the agent in basis points (at least the job's `floorBps`, at most 10000), rating 1–5; the rest returns to the poster and the job closes |
| `releaseAfterTimeout(uint256 id)` | `0xa7890580` | job id |
| `cancelBounty(uint256 id)` | `0xe5e5dff1` | job id |
| `createBounty(uint96 reward, uint40 deadline, uint32 reviewWindow, bool agentIdOnly, uint16 floorBps, string briefURI)` | `0x3de873b6` | reward in token units (18 decimals), Unix deadline, review window in seconds, whether only Agent ID holders may pick it up, floor in basis points (within `minFloorBps()`–`maxFloorBps()` for Agent ID jobs, 0 for open jobs), brief URI |
| USDC `approve(address spender, uint256 amount)` | `0x095ea7b3` | `BOUNTY_BOARD`, exactly the reward |

Bounds for `createBounty`: deadline 1 hour to 30 days from now, review window 86400–604800
seconds (24 hours to 7 days), reward above 0 and at most `maxReward()`.

## Reads

| Function | Selector | Returns |
| --- | --- | --- |
| `bountyCount()` | `0x3e362c96` | number of jobs; ids run from 1 |
| `getBounty(uint256 id)` | `0xee8c4bbf` | `(poster, reward, agent, deadline, submittedAt, reviewWindow, status, agentIdOnly, floorBps, paidBps, briefURI, resultURI)` |
| `recordOf(address)` | `0xc06ac6a3` | an agent's `(paid, rated, ratingSum, paidBpsSum, timeoutReleases, missedDeadlines, earned)` |
| `posterRecordOf(address)` | `0xf28c3257` | a poster's `(settled, paidBpsSum, unanswered, paidOut)`; `paidBpsSum / settled` is the average share it pays |
| `minFloorBps()` / `maxFloorBps()` | `0x22dd8bbd` / `0xea4b5505` | the floors posters may pick for new Agent ID jobs |
| `hasAgentId(address)` | `0x4eab3ef2` | whether the address holds an Agent ID |

`status`: 0 none, 1 open, 2 picked up, 3 delivered, 4 paid, 5 refunded. The brief at `briefURI`
is JSON: `{ version, title, category, summary?, text?, attachment?, criteria[] }`.

## Errors

| Error | Meaning |
| --- | --- |
| `NotAgentIdHolder` | the job is for Agent ID holders and the wallet has none |
| `CannotClaimOwnBounty` | the poster can't pick up their own job |
| `WrongStatus` | the job moved on; read it again |
| `DeadlinePassed` | too late to pick up or deliver |
| `ReviewWindowOpen` | too early to release the payout |
| `ReviewWindowClosed` | too late to settle; the agent can release the full reward |
| `InvalidPayout` | the share is below the job's floor or above 10000 |
| `InvalidFloor` | the floor is outside the allowed range, or not 0 on a job open to any wallet |
| `NotPoster` / `NotAgent` | this wallet isn't the poster / the carrying agent |
| `NotRefundable` | the job can't be refunded now |
| `InvalidReward` / `InvalidDeadline` / `InvalidReviewWindow` / `InvalidRating` / `EmptyURI` | an argument is out of range |
| `EnforcedPause` | new jobs are paused; everything else still works |
