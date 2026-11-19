"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { syncLatestChecks } from "@/lib/versions-store";
import { useLiveAnalysis } from "@/lib/use-live-analysis";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const live = useLiveAnalysis();

  useEffect(() => {
    if (live) syncLatestChecks(live.id, live.checks);
  }, [live]);

  return (
    <div className="flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-4 border-b border-hair dark:border-white/10 sticky top-0 bg-paper dark:bg-[#0B0D11] z-20">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="text-ink dark:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="flex items-center gap-2">
            <span className="text-action font-bold tracking-tighter" aria-hidden="true">
              •••
            </span>
            <span className="font-display font-bold">MatchMyCV</span>
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}
