import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { Mailbag } from "@/features/mailbag/Mailbag";

export const metadata: Metadata = { title: "My mailbag · Agent Bounty Board" };

export default function MailbagPage() {
  return (
    <AppShell>
      <Mailbag />
    </AppShell>
  );
}
