import type { ReactNode } from "react";

import { AppHeader } from "./AppHeader";
import styles from "./AppShell.module.css";
import { SetupNotices } from "./SetupNotices";
import { SiteFooter } from "./SiteFooter";

/** Header, setup notices, page body and footer shared by every app screen. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className={styles.main}>
        <SetupNotices />
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
