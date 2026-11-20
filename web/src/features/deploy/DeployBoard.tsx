"use client";

import { useState } from "react";
import { erc20Abi, getAddress, isAddress, parseUnits, type Address } from "viem";
import { useAccount, useReadContracts, useSwitchChain } from "wagmi";

import { Button } from "@/components/ui/Button";
import { ConnectInline } from "@/components/ui/ConnectInline";
import { Notice } from "@/components/ui/Notice";
import { TxStatus } from "@/components/ui/TxStatus";
import { env } from "@/lib/config/env";
import { activeChain, explorerAddressUrl } from "@/lib/contracts/chain";
import { DEFAULT_MAX_REWARD, KNOWN } from "@/lib/contracts/known";
import { shortAddress } from "@/lib/format";

import styles from "./DeployBoard.module.css";
import { DeployResult } from "./DeployResult";
import { useDeployBoard } from "./useDeployBoard";

const agentIdAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

const asAddress = (v: string): Address | null =>
  isAddress(v.trim()) ? getAddress(v.trim()) : null;

/**
 * Deploys the board from the operator's own wallet, then prints the settings to paste into the
 * host. Not linked from the site; it exists so launching needs no private key on any server.
 */
export function DeployBoard() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const known = KNOWN[env.chainId];
  const [token, setToken] = useState<string>(known.rewardToken ?? "");
  const [agentId, setAgentId] = useState<string>(known.agentId ?? "");
  const [maxReward, setMaxReward] = useState(DEFAULT_MAX_REWARD);
  const [owner, setOwner] = useState("");
  const { deploy, phase, error, hash, deployed, busy } = useDeployBoard();

  const tokenAddr = asAddress(token);
  const idAddr = asAddress(agentId);
  const ownerAddr = asAddress(owner) ?? (owner.trim() ? null : (address ?? null));

  const reads = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: tokenAddr!, abi: erc20Abi, functionName: "symbol", chainId: activeChain.id },
      { address: tokenAddr!, abi: erc20Abi, functionName: "decimals", chainId: activeChain.id },
      { address: idAddr!, abi: agentIdAbi, functionName: "name", chainId: activeChain.id },
    ],
    query: { enabled: Boolean(tokenAddr && idAddr) },
  });
  const symbol = reads.data?.[0]?.result;
  const decimals = reads.data?.[1]?.result;
  const idName = reads.data?.[2]?.result;

  let cap: bigint | null = null;
  try {
    cap = decimals !== undefined && Number(maxReward) > 0 ? parseUnits(maxReward, decimals) : null;
  } catch {
    cap = null;
  }

  if (deployed) return <DeployResult deployed={deployed} />;

  const ready = Boolean(tokenAddr && idAddr && ownerAddr && cap && symbol && idName);
  const wrongChain = isConnected && chainId !== activeChain.id;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="mono">Operator · {activeChain.name}</p>
        <h1 className={styles.title}>Open the post office</h1>
        <p className={styles.lede}>
          Deploy the bounty board from your own wallet. Nothing here touches a private key: your
          wallet signs one transaction, and the page prints the settings for your host.
        </p>
      </header>

      {env.isConfigured && (
        <Notice>
          This site already points at board{" "}
          <a href={explorerAddressUrl(env.boardAddress)} target="_blank" rel="noreferrer">
            {shortAddress(env.boardAddress)}
          </a>
          . Deploying again makes a separate, empty board.
        </Notice>
      )}

      <div className={styles.form}>
        <Field
          label="Reward token"
          value={token}
          onChange={setToken}
          check={
            tokenAddr
              ? symbol
                ? `${symbol} · ${decimals} decimals`
                : "Reading…"
              : "Not an address"
          }
          ok={Boolean(symbol)}
        />
        <Field
          label="Agent ID contract"
          value={agentId}
          onChange={setAgentId}
          check={idAddr ? (idName ?? "Reading…") : "Not an address"}
          ok={Boolean(idName)}
        />
        <Field
          label={`Largest reward per job${symbol ? ` (${symbol})` : ""}`}
          value={maxReward}
          onChange={setMaxReward}
          inputMode="decimal"
          check={cap ? "Fixed for good once deployed" : "Enter an amount above zero"}
          ok={Boolean(cap)}
        />
        <Field
          label="Owner"
          value={owner}
          onChange={setOwner}
          placeholder={address ?? "0x…"}
          check={
            ownerAddr
              ? `${owner.trim() ? "" : "Your wallet · "}can pause new jobs, can’t touch escrow`
              : "Not an address"
          }
          ok={Boolean(ownerAddr)}
        />
      </div>

      <div className={styles.go}>
        {!isConnected ? (
          <ConnectInline hint="Binance Wallet is picked first. Any wallet with a little BNB can deploy." />
        ) : wrongChain ? (
          <Button
            size="lg"
            disabled={switching}
            onClick={() => switchChain({ chainId: activeChain.id })}
          >
            Switch to {activeChain.name}
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={!ready || busy}
            onClick={() =>
              deploy({
                rewardToken: tokenAddr!,
                agentId: idAddr!,
                maxReward: cap!,
                owner: ownerAddr!,
              })
            }
          >
            Deploy the board
          </Button>
        )}
        <p className={styles.hint}>
          Costs a little {activeChain.nativeCurrency.symbol} for gas. The deploying wallet needs no
          Agent ID.
        </p>
        <TxStatus phase={phase} error={error} hash={hash} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  check,
  ok,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  check: string;
  ok: boolean;
  placeholder?: string;
  inputMode?: "decimal";
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={`mono ${ok ? styles.ok : styles.check}`}>{check}</span>
    </label>
  );
}
