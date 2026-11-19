"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NeedsAnalysis } from "@/components/needs-analysis";
import { PageHeader } from "@/components/page-header";
import { useAnalysis } from "@/lib/analysis-store";
import { clearJd, saveJd, useJd } from "@/lib/jd-store";
import { scoreRequirements, verdictFor, type JdAnalysis, type JdKind, type JdVerdict } from "@/lib/jd-types";
import { buildSampleJd } from "@/lib/sample-jd";

const tone = {
  pass: { text: "text-pass", bar: "bg-pass" },
  warn: { text: "text-warn", bar: "bg-warn" },
  fail: { text: "text-fail", bar: "bg-fail" },
};

const rowStyle: Record<JdVerdict, { border: string; bg: string; badge: string; label: string }> = {
  match: { border: "border-l-pass", bg: "bg-pass/[0.04]", badge: "bg-pass/10 text-pass", label: "MATCH" },
  partial: { border: "border-l-warn", bg: "bg-warn/[0.04]", badge: "bg-warn/10 text-warn", label: "PARTIAL" },
  missing: { border: "border-l-fail", bg: "bg-fail/[0.04]", badge: "bg-fail/10 text-fail", label: "MISSING" },
};

const inputClass =
  "w-full bg-transparent border border-hair dark:border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-action";

export default function JdMatchPage() {
  const analysis = useAnalysis();
  const stored = useJd();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (analysis === undefined || stored === undefined) return <div className="px-5 sm:px-10 py-10" />;
  if (analysis === null) return <NeedsAnalysis what="JD Match compares a job description with the resume from your latest run." />;

  const jd = stored && stored.analysisId === analysis.id ? stored : null;

  async function score() {
    if (!analysis) return;
    setBusy(true);
    setError(null);
    try {
      let result: JdAnalysis;
      if (analysis.source === "sample") {
        result = buildSampleJd(text, title, company);
      } else {
        const res = await fetch("/api/jd-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: analysis.resumeText, jdText: text, title, company }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Please try again.");
        result = json.jd as JdAnalysis;
      }
      saveJd({ ...result, analysisId: analysis.id });
    } catch (err) {
      setError(err instanceof TypeError ? "Could not reach the server. Check your connection and try again." : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    if (jd) {
      setText(jd.jdText);
      setTitle(jd.title);
      setCompany(jd.company);
    }
    clearJd();
  }

  if (!jd) {
    return (
      <div>
        <PageHeader title="JD Match" crumb="JD Match" />
        <div className="px-5 sm:px-10 py-8 max-w-3xl mx-auto">
          <p className="text-muted dark:text-white/60 mb-6">
            Paste a job description. Each requirement is checked against the resume from run #{analysis.runNumber}.
          </p>
          {error && (
            <div role="alert" className="border border-fail/30 bg-fail/5 text-fail text-sm rounded-lg p-4 mb-4">
              {error}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="block text-sm mb-1.5">Job title (optional)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Senior Backend Engineer" />
            </label>
            <label className="block">
              <span className="block text-sm mb-1.5">Company (optional)</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} placeholder="Acme" />
            </label>
          </div>
          <textarea
            rows={16}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Job description"
            placeholder={"Paste the full job description here, including the Requirements and Nice to have sections."}
            className={`${inputClass} resize-y leading-relaxed mb-4`}
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted dark:text-white/40">{text.trim().length < 80 ? `${text.trim().length} / 80 characters` : "Ready"}</span>
            <button
              onClick={score}
              disabled={busy || text.trim().length < 80}
              className="flex items-center gap-2 bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 transition-colors disabled:bg-hair dark:disabled:bg-white/10 disabled:text-muted dark:disabled:text-white/30 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {busy ? "Scoring" : "Score this job description"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const counts = scoreRequirements(jd.requirements);
  const verdict = verdictFor(jd.score);
  const palette = tone[verdict.tone];
  const kindLabel: Record<JdKind, string> = { required: "Required", nice: "Nice to have" };

  return (
    <div>
      <PageHeader
        title="JD Match"
        crumb="JD Match"
        actions={
          <>
            <span className="hidden sm:inline text-sm text-muted dark:text-white/50">
              {jd.title}
              {jd.company ? ` · ${jd.company}` : ""}
            </span>
            <button
              onClick={startOver}
              className="border border-hair dark:border-white/15 text-sm font-medium px-4 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Edit job description
            </button>
          </>
        }
      />
      {jd.warnings.map((w) => (
        <div key={w} role="status" className="border-b border-warn/30 bg-warn/5 text-warn text-sm px-5 sm:px-10 py-3">
          {w}
        </div>
      ))}
      <div className="bg-[#0d1016] px-5 sm:px-10 py-6 flex flex-wrap items-center gap-6">
        <div>
          <p className="font-mono text-xs text-white/40 tracking-wide mb-1">MATCH SCORE</p>
          <p className={`font-display font-bold text-4xl ${palette.text}`}>{jd.score}%</p>
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
            <div className={`h-full ${palette.bar}`} style={{ width: `${jd.score}%` }} />
          </div>
          <p className="font-mono text-xs">
            <span className="text-pass">{counts.match} matched</span>
            <span className="text-white/20 mx-1.5">·</span>
            <span className="text-warn">{counts.partial} partial</span>
            <span className="text-white/20 mx-1.5">·</span>
            <span className="text-fail">{counts.missing} missing</span>
          </p>
        </div>
        <div className="text-right ml-auto">
          <p className="font-mono text-xs text-white/40 tracking-wide mb-1">VERDICT</p>
          <p className={`${palette.text} font-medium`}>{verdict.label}</p>
        </div>
      </div>
      <p className="px-5 sm:px-10 py-3 text-xs text-muted dark:text-white/40 border-b border-hair dark:border-white/10">
        {jd.source === "ai" ? `Compared by AI model ${jd.model ?? ""}. Evidence lines are copied from your resume.` : "Compared by keyword matching. Run it again later for an AI comparison."}
      </p>
      <div>
        {jd.requirements.map((r) => {
          const style = rowStyle[r.verdict];
          return (
            <div key={r.id} className={`border-l-4 ${style.border} ${style.bg} border-t first:border-t-0 border-hair dark:border-white/10 px-5 sm:px-10 py-5`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${style.badge}`}>{style.label}</span>
                <span className="font-mono text-xs text-muted dark:text-white/40">{kindLabel[r.kind]}</span>
              </div>
              <p className="font-medium mb-2">{r.text}</p>
              {r.evidence && (
                <p className="font-mono text-sm border-l-2 border-hair dark:border-white/20 pl-3 mb-2">{r.evidence}</p>
              )}
              <p className="text-xs text-muted dark:text-white/50">{r.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
