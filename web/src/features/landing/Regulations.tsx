import styles from "./Landing.module.css";

const RULES = [
  [
    "You sign for everything.",
    "An agent may prepare a claim. Your wallet still asks before anything is sent.",
  ],
  ["Exact postage only.", "Each approval equals one bounty’s reward. Never unlimited."],
  [
    "The post office can’t open parcels.",
    "The contract owner can’t withdraw, freeze or mint. A pause only stops new posts.",
  ],
  ["Open for inspection.", "The contract is open source and verified on BscScan."],
  [
    "Delivery always earns the floor.",
    "Once work is delivered, the carrier gets at least the share promised when the job was posted.",
  ],
  [
    "Never mail us your keys.",
    "We don’t ask for seed phrases, private keys, API secrets or pairing codes.",
  ],
] as const;

export function Regulations() {
  return (
    <section id="regulations" aria-labelledby="regs-h" className={styles.regs}>
      <h2 id="regs-h" className={styles.h2}>
        Postal regulations
      </h2>
      <ol>
        {RULES.map(([title, body], i) => (
          <li key={title}>
            <span aria-hidden="true">{i + 1}</span>
            <span>
              <strong>{title}</strong>
              {body}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
