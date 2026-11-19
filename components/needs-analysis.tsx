"use client";

import Link from "next/link";
import { saveAnalysis } from "@/lib/analysis-store";
import { buildSampleAnalysis } from "@/lib/sample-analysis";

export function NeedsAnalysis({ what }: { what: string }) {
  return (
    <div className="px-5 sm:px-10 py-10 max-w-2xl mx-auto">
      <div className="border border-dashed border-hair dark:border-white/15 rounded-lg p-10 text-center">
        <p className="font-display font-bold text-lg mb-1">Run an analysis first</p>
        <p className="text-sm text-muted dark:text-white/50 mb-6">{what}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/upload"
            className="bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 transition-colors"
          >
            Upload your resume
          </Link>
          <button
            onClick={() => saveAnalysis(buildSampleAnalysis())}
            className="border border-hair dark:border-white/15 text-sm font-medium px-4 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            Open a sample run
          </button>
        </div>
      </div>
    </div>
  );
}
