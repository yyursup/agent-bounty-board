import { encodeFunctionData, erc20Abi, formatUnits, type Address, type Hex } from "viem";

import { bountyBoardAbi } from "@/lib/contracts/abi/bountyBoard";

/**
 * Ready-to-paste instructions for Binance AI Pro, or any agent connected to an Agentic Wallet.
 * The agent calls the contract itself; the user confirms in the Binance App. Every step carries
 * the function in words and the raw calldata, so agents that only take hex can use it too.
 */

export type AgentStep = {
  summary: string;
  to: Address;
  signature: string;
  args: string;
  data: Hex;
};

export type AgentTask = { goal: string; steps: AgentStep[]; prompt: string };

export type PromptContext = {
  chainId: number;
  chainName: string;
  board: Address;
  token: Address;
  decimals: number;
  symbol: string;
  /** The wallet that must make the calls, when the page knows it. */
  wallet?: Address;
};

const SIGNATURES = {
  claimBounty: "claimBounty(uint256 id)",
  submitWork: "submitWork(uint256 id, string resultURI)",
  approveWork: "approveWork(uint256 id, uint8 rating)",
  rejectWork: "rejectWork(uint256 id)",
  releaseAfterTimeout: "releaseAfterTimeout(uint256 id)",
  cancelBounty: "cancelBounty(uint256 id)",
  createBounty:
    "createBounty(uint96 reward, uint40 deadline, uint32 reviewWindow, string briefURI)",
} as const;

type BoardCall =
  | {
      functionName: "claimBounty" | "rejectWork" | "releaseAfterTimeout" | "cancelBounty";
      args: readonly [bigint];
    }
  | { functionName: "submitWork"; args: readonly [bigint, string] }
  | { functionName: "approveWork"; args: readonly [bigint, number] }
  | { functionName: "createBounty"; args: readonly [bigint, number, number, string] };

function boardStep(ctx: PromptContext, summary: string, call: BoardCall, args: string): AgentStep {
  return {
    summary,
    to: ctx.board,
    signature: SIGNATURES[call.functionName],
    args,
    data: encodeFunctionData({ abi: bountyBoardAbi, ...call } as Parameters<
      typeof encodeFunctionData
    >[0]),
  };
}

function render(ctx: PromptContext, goal: string, steps: AgentStep[], closing?: string): string {
  const lines: string[] = [
    `Use my Binance Agentic Wallet to ${goal} on Agent Bounty Board.`,
    "",
    `Network: ${ctx.chainName} (chain ID ${ctx.chainId})`,
  ];
  if (ctx.wallet) {
    lines.push(
      `Wallet: must be ${ctx.wallet}. If your wallet is a different address, stop and tell me.`,
    );
  }
  steps.forEach((s, i) => {
    lines.push(
      "",
      steps.length > 1 ? `Step ${i + 1} of ${steps.length}: ${s.summary}` : s.summary,
      `  Contract: ${s.to}`,
      `  Function: ${s.signature}`,
      `  Arguments: ${s.args}`,
      "  Value: 0",
      `  Calldata: ${s.data}`,
    );
  });
  lines.push(
    "",
    "Rules:",
    "- Show me the preview of each call and wait for my confirmation before executing it.",
    ...(steps.length > 1
      ? ["- Start a step only after the previous one is confirmed on-chain."]
      : []),
    "- If a call would revert or fails, stop and tell me the reason. Do not retry on your own.",
    "- Never ask me for a seed phrase, private key, API secret or pairing code.",
    "- When done, give me the transaction hash of every call.",
  );
  if (closing) lines.push("", closing);
  return lines.join("\n");
}

function task(ctx: PromptContext, goal: string, steps: AgentStep[], closing?: string): AgentTask {
  return { goal, steps, prompt: render(ctx, goal, steps, closing) };
}

const ref = (id: bigint) => `#${id}`;

export function claimTask(ctx: PromptContext, id: bigint): AgentTask {
  return task(
    ctx,
    `pick up job ${ref(id)}`,
    [
      boardStep(
        ctx,
        `Pick up job ${ref(id)}`,
        { functionName: "claimBounty", args: [id] },
        `id = ${id}`,
      ),
    ],
    "My wallet needs an Agent ID, and I can't pick up a job I posted myself.",
  );
}

export function deliverTask(ctx: PromptContext, id: bigint, resultURI: string): AgentTask {
  return task(ctx, `deliver my work for job ${ref(id)}`, [
    boardStep(
      ctx,
      `File the result for job ${ref(id)}`,
      { functionName: "submitWork", args: [id, resultURI] },
      `id = ${id}, resultURI = "${resultURI}"`,
    ),
  ]);
}

export function signTask(ctx: PromptContext, id: bigint, rating: number): AgentTask {
  return task(ctx, `sign for job ${ref(id)} and pay the agent`, [
    boardStep(
      ctx,
      `Approve the work on job ${ref(id)} with a rating of ${rating}/5`,
      { functionName: "approveWork", args: [id, rating] },
      `id = ${id}, rating = ${rating}`,
    ),
  ]);
}

export function returnTask(ctx: PromptContext, id: bigint): AgentTask {
  return task(
    ctx,
    `return the delivery on job ${ref(id)}`,
    [
      boardStep(
        ctx,
        `Reject the delivery on job ${ref(id)}`,
        { functionName: "rejectWork", args: [id] },
        `id = ${id}`,
      ),
    ],
    "The job goes back on the board for another agent, and the rejection is recorded.",
  );
}

export function releaseTask(ctx: PromptContext, id: bigint): AgentTask {
  return task(
    ctx,
    `release my payment for job ${ref(id)}`,
    [
      boardStep(
        ctx,
        `Release the reward for job ${ref(id)}`,
        { functionName: "releaseAfterTimeout", args: [id] },
        `id = ${id}`,
      ),
    ],
    "This only works after the review window closed without an answer.",
  );
}

export function refundTask(ctx: PromptContext, id: bigint): AgentTask {
  return task(ctx, `take back the reward for job ${ref(id)}`, [
    boardStep(
      ctx,
      `Cancel job ${ref(id)} and refund the reward`,
      { functionName: "cancelBounty", args: [id] },
      `id = ${id}`,
    ),
  ]);
}

export function postTask(
  ctx: PromptContext,
  job: { title: string; reward: bigint; deadline: number; reviewWindow: number; briefURI: string },
): AgentTask {
  const human = `${formatUnits(job.reward, ctx.decimals)} ${ctx.symbol}`;
  const approve: AgentStep = {
    summary: `Approve exactly ${human} for the board (never an unlimited amount)`,
    to: ctx.token,
    signature: "approve(address spender, uint256 amount)",
    args: `spender = ${ctx.board}, amount = ${job.reward} (${human})`,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [ctx.board, job.reward],
    }),
  };
  const create = boardStep(
    ctx,
    `Post the job "${job.title}" and lock ${human} in escrow`,
    {
      functionName: "createBounty",
      args: [job.reward, job.deadline, job.reviewWindow, job.briefURI],
    },
    `reward = ${job.reward} (${human}), deadline = ${job.deadline} (${new Date(job.deadline * 1000).toISOString()}), reviewWindow = ${job.reviewWindow} seconds, briefURI = "${job.briefURI}"`,
  );
  return task(
    ctx,
    `post a job with a ${human} reward`,
    [approve, create],
    "My wallet needs an Agent ID and enough " + ctx.symbol + " for the reward.",
  );
}
