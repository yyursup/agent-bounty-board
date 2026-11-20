import { decodeFunctionData, erc20Abi } from "viem";
import { describe, expect, it } from "vitest";

import { bountyBoardAbi } from "@/lib/contracts/abi/bountyBoard";

import { claimTask, deliverTask, postTask, signTask, type PromptContext } from "./prompts";

const ctx: PromptContext = {
  chainId: 56,
  chainName: "BNB Chain",
  board: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  token: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  decimals: 18,
  symbol: "USDC",
  wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
};

describe("agent prompts", () => {
  it("names the chain, contract, wallet and safety rules", () => {
    const { prompt } = claimTask(ctx, 145n);
    expect(prompt).toContain("chain ID 56");
    expect(prompt).toContain(ctx.board);
    expect(prompt).toContain(`must be ${ctx.wallet}`);
    expect(prompt).toContain("claimBounty(uint256 id)");
    expect(prompt).toContain("wait for my confirmation");
    expect(prompt).toMatch(/Never ask me for a seed phrase/);
  });

  it("carries calldata that decodes to the intended call", () => {
    const step = signTask(ctx, 7n, 4).steps[0]!;
    const decoded = decodeFunctionData({ abi: bountyBoardAbi, data: step.data });
    expect(decoded.functionName).toBe("approveWork");
    expect(decoded.args).toEqual([7n, 4]);

    const deliver = decodeFunctionData({
      abi: bountyBoardAbi,
      data: deliverTask(ctx, 3n, "ipfs://r").steps[0]!.data,
    });
    expect(deliver.args).toEqual([3n, "ipfs://r"]);
  });

  it("posts in two steps: an exact approval, then the job", () => {
    const t = postTask(ctx, {
      title: "Summarize",
      reward: 12_000_000_000_000_000_000n,
      deadline: 1_800_000_000,
      reviewWindow: 172_800,
      briefURI: "ipfs://brief",
    });
    expect(t.steps).toHaveLength(2);
    const approve = decodeFunctionData({ abi: erc20Abi, data: t.steps[0]!.data });
    expect(approve.args).toEqual([ctx.board, 12_000_000_000_000_000_000n]);
    expect(t.steps[0]!.to).toBe(ctx.token);
    const create = decodeFunctionData({ abi: bountyBoardAbi, data: t.steps[1]!.data });
    expect(create.functionName).toBe("createBounty");
    expect(t.prompt).toContain("12 USDC");
    expect(t.prompt).toContain("only after the previous one is confirmed");
  });

  it("leaves out the wallet line when the page doesn't know the wallet", () => {
    expect(claimTask({ ...ctx, wallet: undefined }, 1n).prompt).not.toContain("must be");
  });
});
