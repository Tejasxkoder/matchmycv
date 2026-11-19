"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { saveAnalysis, saveStatuses, useAnalysis } from "@/lib/analysis-store";
import { applyAccepted } from "@/lib/apply-changes";
import type { SuggestionCategory, SuggestionStatus } from "@/lib/analysis-types";
import { buildSampleAnalysis } from "@/lib/sample-analysis";

const tabs: { label: string; value: SuggestionCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "ATS", value: "ats" },
  { label: "Quantify", value: "quantify" },
  { label: "Tone", value: "tone" },
  { label: "OK", value: "ok" },
];

const categoryStyles: Record<SuggestionCategory, { border: string; badge: string; label: string }> = {
  quantify: { border: "border-l-warn", badge: "bg-warn/10 text-warn", label: "QUANTIFY" },
  ats: { border: "border-l-fail", badge: "bg-fail/10 text-fail", label: "ATS" },
  tone: { border: "border-l-warn", badge: "bg-warn/10 text-warn", label: "TONE" },
  ok: { border: "border-l-pass", badge: "bg-pass/10 text-pass", label: "OK" },
};

function WithPlaceholders({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]\n]{1,30}\])/g).map((part, i) =>
        /^\[[^\]\n]{1,30}\]$/.test(part) ? (
          <span key={i} className="bg-warn/15 text-warn rounded px-0.5">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

export default function ResumeAnalysisPage() {
  const analysis = useAnalysis();
  const [activeTab, setActiveTab] = useState<SuggestionCategory | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);

  const crumbs = (
    <p className="text-sm text-muted dark:text-white/50 mb-2">
      <Link href="/dashboard" className="hover:text-ink dark:hover:text-white transition-colors">
        Dashboard
      </Link>{" "}
      / <span className="text-ink dark:text-white">Resume Analysis</span>
    </p>
  );

  if (analysis === undefined) return <div className="px-5 sm:px-10 py-10" />;

  if (analysis === null) {
    return (
      <div className="px-5 sm:px-10 py-8 sm:py-10">
        {crumbs}
        <h1 className="font-display font-bold text-2xl sm:text-3xl mb-6">Resume Analysis</h1>
        <div className="border border-dashed border-hair dark:border-white/15 rounded-lg p-10 text-center">
          <p className="font-display font-bold text-lg mb-1">No analysis to review yet</p>
          <p className="text-sm text-muted dark:text-white/50 mb-6">Upload a resume and the rewrite suggestions will appear here.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/upload" className="bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 transition-colors">
              Upload your resume
            </Link>
            <button
              onClick={() => saveAnalysis(buildSampleAnalysis())}
              className="border border-hair dark:border-white/15 text-sm font-medium px-4 py-2.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Open a sample run
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { suggestions, statuses } = analysis;
  const statusOf = (id: number): SuggestionStatus => statuses[id] ?? "pending";
  const setStatus = (id: number, status: SuggestionStatus) => {
    setNotice(null);
    saveStatuses({ ...statuses, [id]: status });
  };

  const accepted = suggestions.filter((s) => statusOf(s.id) === "accepted").length;
  const rejected = suggestions.filter((s) => statusOf(s.id) === "rejected").length;
  const pending = suggestions.length - accepted - rejected;
  const visible = activeTab === "all" ? suggestions : suggestions.filter((s) => s.category === activeTab);

  function download() {
    const result = applyAccepted(analysis!.resumeText, suggestions, statuses);
    if (result.applied === 0) {
      setNotice("Accept at least one rewrite first.");
      return;
    }
    const base = analysis!.fileName.replace(/\.[^.]+$/, "") || "resume";
    const url = URL.createObjectURL(new Blob([result.text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${base}-improved.txt`;
    link.click();
    URL.revokeObjectURL(url);

    let message = `Downloaded ${base}-improved.txt with ${result.applied} change${result.applied === 1 ? "" : "s"}.`;
    if (result.unresolved > 0) {
      message += ` ${result.unresolved} placeholder${result.unresolved === 1 ? "" : "s"} in [brackets] still need your real numbers.`;
    }
    if (result.skipped > 0) message += ` ${result.skipped} could not be matched in the text.`;
    setNotice(message);
  }

  return (
    <div className="px-5 sm:px-10 py-8 sm:py-10">
      {crumbs}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h1 className="font-display font-bold text-2xl sm:text-3xl">Resume Analysis · run #{analysis.runNumber}</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-mono whitespace-nowrap">
            <span className="text-pass">{accepted} accepted</span>{" "}
            <span className="text-fail ml-2">{rejected} rejected</span>{" "}
            <span className="text-muted dark:text-white/50 ml-2">{pending} pending</span>
          </span>
          <button
            onClick={download}
            className="bg-action text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-action/90 transition-colors whitespace-nowrap"
          >
            Apply accepted changes
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="border border-hair dark:border-white/15 text-sm rounded-lg px-4 py-3 mb-4">
          {notice}
        </div>
      )}

      {analysis.warnings.map((warning) => (
        <div key={warning} role="status" className="border border-warn/30 bg-warn/5 text-warn text-sm rounded-lg px-4 py-3 mb-4">
          {warning}
        </div>
      ))}

      {suggestions.length === 0 ? (
        <div className="border border-dashed border-hair dark:border-white/15 rounded-lg p-10 text-center">
          <p className="font-display font-bold text-lg mb-1">No rewrite suggestions in this run</p>
          <p className="text-sm text-muted dark:text-white/50 mb-6">The checks on the dashboard still ran. Re-run to ask the AI again.</p>
          <Link href="/upload" className="bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 transition-colors">
            Re-run with new resume
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="inline-flex border border-hair dark:border-white/15 rounded-md overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 text-sm font-medium border-l border-hair dark:border-white/15 first:border-l-0 transition-colors ${
                    activeTab === tab.value
                      ? "bg-ink dark:bg-white text-white dark:text-ink"
                      : "text-muted dark:text-white/60 hover:text-ink dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-muted dark:text-white/50">{suggestions.length} suggestions</span>
          </div>

          <div className="border border-hair dark:border-white/10 rounded-lg overflow-hidden">
            <div className="hidden lg:grid grid-cols-[40px_1.4fr_1.4fr_140px] gap-4 px-5 py-3 bg-black/[0.03] dark:bg-white/[0.04] font-mono text-xs text-muted dark:text-white/40 uppercase">
              <span>#</span>
              <span>Current</span>
              <span>Suggested</span>
              <span>Action</span>
            </div>

            {visible.map((s) => {
              const status = statusOf(s.id);
              const style = categoryStyles[s.category];
              return (
                <div
                  key={s.id}
                  className={`grid lg:grid-cols-[40px_1.4fr_1.4fr_140px] gap-3 lg:gap-4 px-5 py-4 border-l-4 ${style.border} border-t border-hair dark:border-white/10 first:border-t-0 lg:first:border-t transition-colors ${
                    status === "accepted" ? "bg-pass/[0.04]" : status === "rejected" ? "opacity-50" : ""
                  }`}
                >
                  <div className="text-sm text-muted dark:text-white/40 self-center">{s.id}</div>

                  <div className="font-mono text-sm break-words">
                    {s.changed ? (
                      <span className="line-through text-muted dark:text-white/40">{s.current}</span>
                    ) : (
                      s.current
                    )}
                  </div>

                  <div>
                    <p className="font-mono text-sm mb-1.5 break-words">
                      <WithPlaceholders text={s.suggested} />
                    </p>
                    <span className={`inline-block font-mono text-xs px-1.5 py-0.5 rounded mr-2 ${style.badge}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-muted dark:text-white/50">{s.note}</span>
                  </div>

                  <div className="self-center">
                    {status === "pending" ? (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => setStatus(s.id, "accepted")}
                          className="text-sm font-medium px-3 py-1 rounded border border-pass/30 text-pass bg-pass/5 hover:bg-pass/10 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setStatus(s.id, "rejected")}
                          className="text-sm font-medium px-3 py-1 rounded border border-fail/30 text-fail bg-fail/5 hover:bg-fail/10 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className={`text-sm font-medium ${status === "accepted" ? "text-pass" : "text-fail"}`}>
                          {status === "accepted" ? "Accepted" : "Rejected"}
                        </p>
                        <button
                          onClick={() => setStatus(s.id, "pending")}
                          className="text-xs text-action dark:text-[#5C86FF] underline"
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
