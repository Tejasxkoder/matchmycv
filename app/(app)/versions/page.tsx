"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { NeedsAnalysis } from "@/components/needs-analysis";
import { useAnalysis } from "@/lib/analysis-store";
import type { CheckStatus } from "@/lib/analysis-types";
import { timeAgo } from "@/lib/format";
import { tally, useVersions, type VersionEntry } from "@/lib/versions-store";

const RANK: Record<CheckStatus, number> = { pass: 3, warn: 2, fail: 1, pending: 0 };
const CHIP: Record<CheckStatus, string> = {
  pass: "border-pass/60 bg-pass/10 text-pass",
  warn: "border-warn/60 bg-warn/10 text-warn",
  fail: "border-fail/60 bg-fail/10 text-fail",
  pending: "border-hair dark:border-white/20 text-muted dark:text-white/50",
};

function Chip({ status }: { status: CheckStatus }) {
  return <span className={`font-mono text-xs font-medium px-2 py-1 border rounded ${CHIP[status]}`}>{status.toUpperCase()}</span>;
}

function Counts({ v }: { v: VersionEntry }) {
  const c = tally(v.checks);
  return (
    <span className="font-mono text-sm">
      <span className="text-pass">{c.pass}P</span> <span className="text-warn">{c.warn}W</span> <span className="text-fail">{c.fail}F</span>
    </span>
  );
}

function Bar({ v }: { v: VersionEntry }) {
  const c = tally(v.checks);
  const total = Math.max(1, c.pass + c.warn + c.fail);
  return (
    <span className="flex h-1.5 w-20 rounded-full overflow-hidden bg-black/10 dark:bg-white/10" aria-hidden="true">
      <span className="bg-pass" style={{ width: `${(c.pass / total) * 100}%` }} />
      <span className="bg-warn" style={{ width: `${(c.warn / total) * 100}%` }} />
      <span className="bg-fail" style={{ width: `${(c.fail / total) * 100}%` }} />
    </span>
  );
}

function download(v: VersionEntry) {
  const url = URL.createObjectURL(new Blob([v.resumeText], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-v${v.runNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VersionsPage() {
  const analysis = useAnalysis();
  const versions = useVersions();
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  if (analysis === undefined || versions === undefined) return <div className="px-5 sm:px-10 py-10" />;
  if (!versions || versions.length === 0) return <NeedsAnalysis what="Every analysis you run is saved here as a version you can compare." />;

  const chosen = selected.map((id) => versions.find((v) => v.id === id)).filter((v): v is VersionEntry => !!v);
  let older: VersionEntry | null = null;
  let newer: VersionEntry | null = null;
  if (chosen.length === 2) {
    [older, newer] = versions.indexOf(chosen[0]) < versions.indexOf(chosen[1]) ? [chosen[1], chosen[0]] : [chosen[0], chosen[1]];
  }

  function pick(id: string) {
    if (!compare) return;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = [...prev, id];
      return next.length > 2 ? next.slice(1) : next;
    });
  }

  const rows =
    older && newer
      ? newer.checks.map((c) => {
          const before = older!.checks.find((o) => o.id === c.id)?.status ?? "pending";
          return { title: c.title, before, after: c.status, delta: RANK[c.status] - RANK[before] };
        })
      : [];
  const up = rows.filter((r) => r.delta > 0).length;
  const down = rows.filter((r) => r.delta < 0).length;

  return (
    <div>
      <PageHeader
        title="Resume Versions"
        crumb="Versions"
        actions={
          <>
            <button
              type="button"
              aria-pressed={compare}
              onClick={() => {
                setCompare(!compare);
                setSelected([]);
              }}
              className={`text-sm font-medium px-4 py-2.5 rounded-md border ${
                compare ? "border-action text-action dark:text-[#5C86FF] bg-action/[0.06]" : "border-hair dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {compare ? "Done comparing" : "Compare versions"}
            </button>
            <Link href="/upload" className="bg-action text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-action/90">
              Upload new version
            </Link>
          </>
        }
      />
      <div className="px-5 sm:px-10 py-8 max-w-4xl mx-auto">
        {compare && selected.length < 2 && <p className="text-sm text-action dark:text-[#5C86FF] mb-4">Select two versions to compare.</p>}
        <div className="space-y-4">
          {versions.map((v, i) => {
            const on = selected.includes(v.id);
            return (
              <div
                key={v.id}
                className={`border rounded-lg px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2 ${on ? "border-action bg-action/[0.06]" : "border-hair dark:border-white/10"}`}
              >
                <button
                  type="button"
                  onClick={() => pick(v.id)}
                  aria-pressed={on}
                  disabled={!compare}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-left flex-1 min-w-0 ${compare ? "" : "cursor-default"}`}
                >
                  {compare && (
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] leading-none shrink-0 ${on ? "bg-action border-action text-white" : "border-hair dark:border-white/30"}`}>
                      {on ? "✓" : ""}
                    </span>
                  )}
                  <span className="font-mono font-bold">
                    v{v.runNumber}
                    {i === 0 ? " · Current" : i === versions.length - 1 ? " · First upload" : ""}
                  </span>
                  <span className="text-sm text-muted dark:text-white/60">{timeAgo(v.createdAt)}</span>
                  <span className="text-sm text-muted dark:text-white/60 truncate">{v.fileName}</span>
                  <span className="font-mono text-sm text-muted dark:text-white/60">{v.words} words</span>
                  <span className="ml-auto flex items-center gap-4">
                    <Counts v={v} />
                    <Bar v={v} />
                  </span>
                </button>
                <button onClick={() => download(v)} className="text-sm text-action dark:text-[#5C86FF] hover:underline">
                  Download text
                </button>
              </div>
            );
          })}
        </div>

        {older && newer && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-lg mb-4">
              v{older.runNumber} → v{newer.runNumber}
            </h2>
            <div className="border border-hair dark:border-white/10 rounded-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="font-mono text-xs uppercase text-muted dark:text-white/50">
                    <th className="px-5 py-3 font-medium">Check</th>
                    <th className="px-5 py-3 font-medium">v{older.runNumber}</th>
                    <th className="px-5 py-3 font-medium">v{newer.runNumber}</th>
                    <th className="px-5 py-3 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.title} className="border-t border-hair dark:border-white/10">
                      <td className="px-5 py-3 text-sm font-medium">{r.title}</td>
                      <td className="px-5 py-3">
                        <Chip status={r.before} />
                      </td>
                      <td className="px-5 py-3">
                        <Chip status={r.after} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm">
                        {r.delta > 0 ? (
                          <span className="text-pass font-medium">▲ Improved</span>
                        ) : r.delta < 0 ? (
                          <span className="text-fail font-medium">▼ Regressed</span>
                        ) : (
                          <span className="text-muted dark:text-white/50">— No change</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted dark:text-white/60">
              <span className="text-pass font-medium">{up} improved</span> · <span className="text-fail font-medium">{down} regressed</span> · {rows.length - up - down} unchanged
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
