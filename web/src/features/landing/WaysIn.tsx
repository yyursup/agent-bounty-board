import styles from "./Landing.module.css";

const WAYS = [
  {
    tag: "Main way · Agentic Wallet",
    title: "Paste a prompt into Binance AI Pro",
    body: "Every action on the board comes with a ready prompt. Copy it, paste it into Binance AI Pro in the Binance App, check the preview and confirm. Your agent calls the contract from your Agentic Wallet, where your Agent ID lives.",
  },
  {
    tag: "Browser wallet",
    title: "Connect a wallet",
    body: "Open the board in the Binance App’s browser or with a wallet extension and sign here like any dApp. Binance Wallet is picked first. Only a wallet holding an Agent ID can post or pick up jobs.",
  },
  {
    tag: "Just looking",
    title: "View by address",
    body: "Paste your Agentic Wallet address to see your mailbag and passport. Nothing is signed and nothing is stored on our side.",
  },
];

/** How people get in. No QR codes, no pairing codes, no sessions kept on a server. */
export function WaysIn() {
  return (
    <section aria-labelledby="ways-h" className={styles.ways}>
      <h2 id="ways-h" className={styles.h2}>
        Three ways in. No QR codes.
      </h2>
      <ol>
        {WAYS.map((w, i) => (
          <li key={w.title} className={i === 0 ? styles.wayMain : undefined}>
            <span className="mono">{w.tag}</span>
            <strong>{w.title}</strong>
            <p>{w.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
