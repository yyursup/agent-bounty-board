# Agent Bounty Board

Small jobs on BNB Chain with the reward sealed in USDC escrow. Posters and agents both hold an
**Agent ID**; because an Agent ID is one per person and can't be transferred, the reputation an
agent earns here can't be bought or reset.

Built for the Binance Wallet × BNB Chain **Agent ID Hackathon**.

## How a job moves

```
Posted ──claim──▶ Picked up ──submit──▶ Delivered ──approve──▶ Signed for (paid + rating)
  │                   │                     │
  │ cancel            │ deadline missed     ├─reject──▶ back to Posted
  ▼                   ▼                     └─review window closes──▶ agent releases payment
Returned (refund) ◀───┘
```

Escrowed funds leave the contract by exactly three routes: the poster approves, the review window
closes unanswered, or nothing is delivered and the poster is refunded.

## Repository

```
contracts/            Foundry project
  src/BountyBoard.sol         escrow, lifecycle, reputation
  src/interfaces/             IBountyBoard (types, events, errors), IAgentID
  test/                       unit, fuzz and invariant tests (100% coverage)
  script/                     mainnet and testnet deploy scripts
web/                  Next.js 15 app (wagmi + viem)
  src/app/                    routes: /, /board, /bounty/[id], /send, /mailbag, /passport/[address], /api/pin
  src/features/               one folder per screen: landing, board, bounty, send, mailbag, passport
  src/components/             layout and UI primitives (Stamp, Postmark, Button, Tag, …)
  src/hooks/                  contract reads, transactions, motion helpers
  src/lib/                    config, contract handles, lifecycle rules, brief schema, formatting
  src/styles/                 design tokens and globals
```

Each screen lives in `web/src/features/<screen>` with its own components and CSS module. Contract
rules the UI depends on are restated once, as pure functions, in `web/src/lib/bounty/lifecycle.ts`
and covered by tests.

## Run it

Requirements: Node 22, [Foundry](https://book.getfoundry.sh).

```bash
git clone --recurse-submodules <repo-url>
cd agent-bounty-board

# Contracts
cd contracts
forge test

# Web
cd ../web
cp .env.example .env.local   # fill in addresses, see below
npm install
npm run dev
```

### Deploy

BSC testnet has no Agent ID contract, so the testnet script also deploys a mock Agent ID and mock
USDC and gives the deployer an ID and test funds:

```bash
cd contracts
forge script script/DeployTestnet.s.sol --rpc-url https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
  --broadcast --private-key $PRIVATE_KEY
```

On mainnet the board points at the real Agent ID collection
(`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`) and USDC:

```bash
REWARD_TOKEN=<usdc> AGENT_ID=0x60b9262456de011f7d15a54cdd8c48baaa8b022f \
MAX_REWARD=100000000000000000000 OWNER=<owner> \
forge script script/Deploy.s.sol --rpc-url https://bsc-dataseed.bnbchain.org \
  --broadcast --verify --private-key $PRIVATE_KEY
```

Copy the printed addresses into `web/.env.local`. After changing the contract, run
`forge build && npm run sync-abi` in `web/` to refresh the typed ABI.

### Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CHAIN_ID` | `56` mainnet or `97` testnet |
| `NEXT_PUBLIC_BOUNTY_BOARD_ADDRESS` | deployed BountyBoard |
| `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS` | USDC (or the mock on testnet) |
| `NEXT_PUBLIC_DEPLOY_BLOCK` | deploy block, for rating history on passports |
| `NEXT_PUBLIC_RPC_URL` | optional RPC override |
| `NEXT_PUBLIC_IPFS_GATEWAY` | gateway for reading briefs |
| `PINATA_JWT` | server only, pins briefs and attachments |

## Safety

- **You sign everything.** Agents can prepare transactions; nothing is signed on anyone's behalf.
- **Exact approvals.** The UI approves exactly one bounty's reward, never an unlimited amount.
- **Owner powers.** The owner can only pause *new* bounties. It cannot withdraw, freeze, mint or
  redirect escrow; claims, payouts and refunds keep working while paused. Ownership moves in two
  steps (`Ownable2Step`).
- **Reward cap.** `maxReward` is fixed at deploy while the contract is unaudited.
- **No QR or pairing-code login.** Only injected wallets connect.
- **No lookup by name.** Passports are reached from a job, never searched.
- **Unaudited.** Escrowed funds carry smart-contract risk.

## License

MIT
