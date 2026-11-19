import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Check, CheckStatus } from "@/lib/analysis-types";

const borderColor: Record<CheckStatus, string> = {
  pass: "border-l-pass",
  warn: "border-l-warn",
  fail: "border-l-fail",
  pending: "border-l-hair dark:border-l-white/20",
};

const badgeStyles: Record<CheckStatus, string> = {
  pass: "bg-pass/10 text-pass",
  warn: "bg-warn/10 text-warn",
  fail: "bg-fail/10 text-fail",
  pending: "bg-black/5 dark:bg-white/10 text-muted dark:text-white/50",
};

export function ChecksTable({ checks }: { checks: Check[] }) {
  return (
    <div className="border border-hair dark:border-white/10 rounded-lg overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1.4fr_0.6fr_1.6fr] gap-4 px-5 py-3 bg-black/[0.03] dark:bg-white/[0.04] font-mono text-xs text-muted dark:text-white/40 uppercase">
        <span>Check</span>
        <span>Status</span>
        <span>Detail</span>
      </div>

      {checks.map((check) => (
        <div
          key={check.id}
          className={`grid sm:grid-cols-[1.4fr_0.6fr_1.6fr] gap-2 sm:gap-4 px-5 py-4 border-l-4 border-t border-hair dark:border-white/10 first:border-t-0 sm:first:border-t ${borderColor[check.status]}`}
        >
          <div className="min-w-0">
            <p className="font-medium">{check.title}</p>
            <p className="font-mono text-xs text-muted dark:text-white/40 truncate">{check.sublabel}</p>
          </div>

          <div>
            <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded ${badgeStyles[check.status]}`}>
              {check.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted dark:text-white/60">{check.detail}</p>
            <Link
              href={check.href}
              className="shrink-0 flex items-center gap-1 text-sm text-action dark:text-[#5C86FF] hover:underline whitespace-nowrap"
            >
              {check.actionLabel} <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
