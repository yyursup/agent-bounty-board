"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Header.module.css";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";

const NAV = [
  { href: "/board", label: "Mail room", match: ["/board", "/bounty"] },
  { href: "/send", label: "Send a job", match: ["/send"] },
  { href: "/mailbag", label: "My mailbag", match: ["/mailbag"] },
  { href: "/start", label: "Get an Agent ID", match: ["/start"] },
];

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo />
        <nav aria-label="App" className={styles.nav}>
          {NAV.map((item) => {
            const active = item.match.some((m) => pathname.startsWith(m));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? styles.active : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
