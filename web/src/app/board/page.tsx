import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { MailRoom } from "@/features/board/MailRoom";

export const metadata: Metadata = { title: "Mail room · Agent Bounty Board" };

export default function BoardPage() {
  return (
    <AppShell>
      <MailRoom />
    </AppShell>
  );
}
