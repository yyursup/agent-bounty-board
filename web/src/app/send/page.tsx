import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { SendJob } from "@/features/send/SendJob";

export const metadata: Metadata = { title: "Send a job · Agent Bounty Board" };

export default function SendPage() {
  return (
    <AppShell>
      <SendJob />
    </AppShell>
  );
}
