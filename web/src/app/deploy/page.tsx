import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { DeployBoard } from "@/features/deploy/DeployBoard";

export const metadata: Metadata = {
  title: "Deploy · Agent Bounty Board",
  robots: { index: false, follow: false },
};

export default function DeployPage() {
  return (
    <AppShell>
      <DeployBoard />
    </AppShell>
  );
}
