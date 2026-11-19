"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Plus } from "lucide-react";
import { navItems, profileNavItem } from "@/lib/nav-items";
import { initials, useProfile } from "@/lib/profile-store";
import { useLiveAnalysis } from "@/lib/use-live-analysis";
import { countChecks } from "@/lib/analysis-types";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const analysis = useLiveAnalysis();
  const profile = useProfile();
  const counts = analysis ? countChecks(analysis.checks) : null;
  const dot = !counts ? "bg-muted/40" : counts.fail > 0 ? "bg-fail" : counts.warn > 0 ? "bg-warn" : "bg-pass";
  const ProfileIcon = profileNavItem.icon;
  const profileActive = pathname === profileNavItem.href;

  return (
    <aside
      className={`w-64 md:w-60 shrink-0 border-r border-hair dark:border-white/10 flex flex-col h-screen
        fixed md:sticky top-0 left-0 z-40 bg-paper dark:bg-[#0B0D11] transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="text-action font-bold tracking-tighter" aria-hidden="true">
            •••
          </span>
          <span className="font-display font-bold text-lg">MatchMyCV</span>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="md:hidden text-muted dark:text-white/60"
        >
          <X size={18} />
        </button>
      </div>
      <p className="px-5 pt-1 pb-4 font-mono text-xs text-muted dark:text-white/40 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
        {analysis && counts ? `run #${analysis.runNumber} · ${counts.warn} warn · ${counts.fail} fail` : "no run yet"}
      </p>

      <div className="px-3 pb-4">
        <Link
          href="/upload"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full bg-action text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-action/90 transition-colors"
        >
          <Plus size={16} aria-hidden="true" />
          New analysis
        </Link>
      </div>

      <nav className="px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-black/5 dark:bg-white/10 text-ink dark:text-white font-medium"
                  : "text-muted dark:text-white/60 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="px-3 pt-3 pb-2 border-t border-hair dark:border-white/10">
        <Link
          href={profileNavItem.href}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            profileActive
              ? "bg-black/5 dark:bg-white/10 text-ink dark:text-white font-medium"
              : "text-muted dark:text-white/60 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <ProfileIcon size={16} aria-hidden="true" />
          {profileNavItem.label}
        </Link>
      </div>

      <div className="px-5 py-4 border-t border-hair dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-action text-white text-xs font-medium flex items-center justify-center shrink-0">
            {initials(profile.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium truncate">{profile.fullName || "Guest"}</span>
            <span className="block text-xs text-muted dark:text-white/40 truncate">
              {profile.email || "Add details in settings"}
            </span>
          </span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
