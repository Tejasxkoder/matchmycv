"use client";

import Link from "next/link";
import { ChecksTable } from "@/components/checks-table";
import { RunSummaryBar } from "@/components/run-summary-bar";
import { saveAnalysis } from "@/lib/analysis-store";
import { useLiveAnalysis } from "@/lib/use-live-analysis";
import { countChecks } from "@/lib/analysis-types";
import { shortTimeAgo, timeAgo } from "@/lib/format";
import { buildSampleAnalysis } from "@/lib/sample-analysis";

const outlineButton =
  "border border-hair dark:border-white/15 text-sm font-medium px-4 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap";

function EmptyRun() {
  return (
    <div className="px-5 sm:px-10 py-8 sm:py-10 max-w-5xl mx-auto">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2">Dashboard</h1>
      <p className="text-muted dark:text-white/60 mb-8">Nothing has been analysed yet.</p>
      <div className="border border-dashed border-hair dark:border-white/15 rounded-lg p-10 text-center">
        <p className="font-display font-bold text-lg mb-1">Run your first analysis</p>
        <p className="text-sm text-muted dark:text-white/50 mb-6">
          Upload a resume and the checks will show up here.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/upload"
            className="bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 transition-colors"
          >
            Upload your resume
          </Link>
          <button onClick={() => saveAnalysis(buildSampleAnalysis())} className={outlineButton}>
            Open a sample run
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const analysis = useLiveAnalysis();

  if (analysis === undefined) return <div className="px-5 sm:px-10 py-10" />;
  if (analysis === null) return <EmptyRun />;

  const counts = countChecks(analysis.checks);
  const ran = counts.pass + counts.warn + counts.fail;

  return (
    <div className="px-5 sm:px-10 py-8 sm:py-10 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <h1 className="font-display font-bold text-2xl sm:text-3xl">MatchMyCV run #{analysis.runNumber}</h1>
        <Link href="/upload" className={outlineButton}>
          Re-run with new resume
        </Link>
      </div>
      <p className="text-sm text-muted dark:text-white/50 font-mono mb-6">
        {analysis.fileName} · triggered {timeAgo(analysis.createdAt)} · {(analysis.runtimeMs / 1000).toFixed(1)}s runtime
      </p>

      {analysis.source === "sample" && (
        <div className="border border-hair dark:border-white/15 text-sm text-muted dark:text-white/60 rounded-lg px-4 py-3 mb-4">
          This is a sample run with made-up data. Upload a resume to see your own results.
        </div>
      )}

      {analysis.warnings.map((warning) => (
        <div key={warning} role="status" className="border border-warn/30 bg-warn/5 text-warn text-sm rounded-lg px-4 py-3 mb-4">
          {warning}
        </div>
      ))}

      <div className="mb-6">
        <RunSummaryBar checks={analysis.checks} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-hair dark:border-white/10 rounded-lg p-4">
          <p className="text-xs text-muted dark:text-white/50 mb-1">Pipeline run</p>
          <p className="font-display font-bold text-2xl">#{analysis.runNumber}</p>
        </div>
        <div className="border border-hair dark:border-white/10 rounded-lg p-4">
          <p className="text-xs text-muted dark:text-white/50 mb-1">Resume version</p>
          <p className="font-display font-bold text-2xl">v{analysis.runNumber}</p>
        </div>
        <div className="border border-hair dark:border-white/10 rounded-lg p-4">
          <p className="text-xs text-muted dark:text-white/50 mb-1">Checks passed</p>
          <p className="font-display font-bold text-2xl">
            {counts.pass} / {ran}
          </p>
        </div>
        <div className="border border-hair dark:border-white/10 rounded-lg p-4">
          <p className="text-xs text-muted dark:text-white/50 mb-1">Last run</p>
          <p className="font-display font-bold text-2xl">{shortTimeAgo(analysis.createdAt)}</p>
        </div>
      </div>

      <ChecksTable checks={analysis.checks} />

      <div className="flex flex-wrap gap-3 mt-6">
        <Link href="/job-market" className={outlineButton}>
          Browse job market
        </Link>
        <Link href="/interview-prep" className={outlineButton}>
          Start interview prep
        </Link>
        <Link href="/versions" className={outlineButton}>
          View version history
        </Link>
      </div>
    </div>
  );
}
