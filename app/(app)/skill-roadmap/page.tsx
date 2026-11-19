"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GraphCanvas } from "@/components/skill-graph/graph-canvas";
import { NeedsAnalysis } from "@/components/needs-analysis";
import { useAnalysis } from "@/lib/analysis-store";
import { useGithub } from "@/lib/github-store";
import { useJd } from "@/lib/jd-store";
import { resourcesFor } from "@/lib/skill-resources";
import { buildSkillGraph, type SkillStatus } from "@/lib/skill-graph";

const badge: Record<SkillStatus, { label: string; cls: string }> = {
  verified: { label: "VERIFIED", cls: "bg-pass/10 text-pass border-pass/30" },
  partial: { label: "PARTIAL", cls: "bg-warn/10 text-warn border-warn/30" },
  missing: { label: "MISSING", cls: "bg-fail/10 text-fail border-fail/30" },
};

export default function SkillRoadmapPage() {
  const analysis = useAnalysis();
  const jd = useJd();
  const github = useGithub();
  const [selected, setSelected] = useState<string | null>(null);

  const graph = useMemo(() => (analysis ? buildSkillGraph(analysis, jd, github) : null), [analysis, jd, github]);

  if (analysis === undefined || jd === undefined || github === undefined) return <div className="px-5 sm:px-10 py-10" />;
  if (analysis === null || graph === null) return <NeedsAnalysis what="The skill graph is built from the skills found in your resume." />;

  const node = graph.nodes.find((n) => n.name === selected) ?? null;
  const gaps = graph.nodes.filter((n) => n.status === "missing");
  const hasJd = !!jd && jd.analysisId === analysis.id;

  return (
    <div className="relative h-[calc(100dvh-57px)] md:h-screen overflow-hidden">
      {graph.nodes.length > 0 && <GraphCanvas graph={graph} selected={selected} onSelect={setSelected} />}

      <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto bg-paper dark:bg-[#0B0D11] border border-hair dark:border-white/10 rounded-xl shadow-sm px-4 py-3">
          <p className="text-xs text-muted dark:text-white/50 mb-1">
            <Link href="/dashboard" className="hover:text-ink dark:hover:text-white">
              Dashboard
            </Link>{" "}
            / <span className="text-ink dark:text-white">Skill Gap</span>
          </p>
          <h1 className="font-display font-bold text-xl sm:text-2xl">Skill Gap Roadmap</h1>
        </div>
        <div className="pointer-events-auto bg-paper dark:bg-[#0B0D11] border border-hair dark:border-white/10 rounded-xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {(["verified", "partial", "missing"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-muted dark:text-white/60 capitalize">
              <span className={`w-2.5 h-2.5 rounded-full border-2 ${s === "verified" ? "border-pass" : s === "partial" ? "border-warn" : "border-fail"}`} />
              {s}
            </span>
          ))}
          <span className="font-mono text-xs border border-hair dark:border-white/15 rounded-md px-2.5 py-1.5">
            {graph.counts.verified} verified · {graph.counts.partial} partial · {graph.counts.missing} missing
          </span>
        </div>
      </div>

      {graph.nodes.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-muted dark:text-white/50 px-6 text-center">
          No recognised skills were found in this resume, so there is nothing to graph yet.
        </p>
      )}

      <div className="absolute right-4 bottom-4 sm:right-5 sm:bottom-5 w-[calc(100%-2rem)] sm:w-[320px] max-h-[40%] sm:max-h-[60%] overflow-y-auto bg-paper dark:bg-[#0B0D11] border border-hair dark:border-white/10 rounded-xl shadow-xl">
        {node ? (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display font-bold text-2xl">{node.name}</h2>
              <button onClick={() => setSelected(null)} aria-label="Close details" className="text-muted dark:text-white/50 hover:text-ink dark:hover:text-white text-xl leading-none">
                ×
              </button>
            </div>
            <span className={`inline-block font-mono text-xs px-2 py-1 rounded border mt-2 ${badge[node.status].cls}`}>{badge[node.status].label}</span>
            <p className="mt-4 text-sm">{node.detail}</p>
            {node.status !== "verified" && (
              <>
                <p className="text-xs tracking-wide text-muted dark:text-white/50 mt-6 mb-2">LEARNING RESOURCES</p>
                <div className="border-t border-hair dark:border-white/10">
                  {resourcesFor(node.name).map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 py-3 border-b border-hair dark:border-white/10 text-sm text-action dark:text-[#5C86FF] hover:underline"
                    >
                      <span>{r.title}</span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-5">
            <p className="text-xs tracking-wide text-muted dark:text-white/50 mb-3">PRIORITY GAPS</p>
            {gaps.length > 0 ? (
              <div className="space-y-2">
                {gaps.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setSelected(g.name)}
                    className="w-full text-left flex items-center gap-3 border border-fail/25 bg-fail/[0.05] rounded-md px-4 py-2.5 text-sm hover:bg-fail/10 transition-colors"
                  >
                    <span className="text-fail font-mono" aria-hidden="true">
                      ×
                    </span>
                    {g.name}
                  </button>
                ))}
              </div>
            ) : hasJd ? (
              <p className="text-sm text-muted dark:text-white/60">Every skill named in the job description is on your resume.</p>
            ) : (
              <p className="text-sm text-muted dark:text-white/60">
                Score a job description on the{" "}
                <Link href="/jd-match" className="text-action dark:text-[#5C86FF] hover:underline">
                  JD Match
                </Link>{" "}
                page to see which skills you are missing.
              </p>
            )}
            <p className="text-xs text-muted dark:text-white/40 mt-3">Select any skill in the graph for its status and learning resources.</p>
          </div>
        )}
      </div>
    </div>
  );
}
