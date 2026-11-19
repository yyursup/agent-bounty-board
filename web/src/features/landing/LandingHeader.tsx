import Link from "next/link";

import header from "@/components/layout/Header.module.css";
import { Logo } from "@/components/layout/Logo";
import { WalletButton } from "@/components/layout/WalletButton";

export function LandingHeader() {
  return (
    <header>
      <div className={header.inner}>
        <Logo />
        <nav aria-label="Primary" className={header.nav}>
          <Link href="/board">Mail room</Link>
          <a href="#route">The route</a>
          <a href="#passport">The passport</a>
          <a href="#regulations">Regulations</a>
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
