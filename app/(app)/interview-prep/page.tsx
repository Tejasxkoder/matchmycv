"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NeedsAnalysis } from "@/components/needs-analysis";
import { PageHeader } from "@/components/page-header";
import { useAnalysis } from "@/lib/analysis-store";
import { useGithub } from "@/lib/github-store";
import { saveInterview, useInterview } from "@/lib/interview-store";
import type { InterviewQuestion, InterviewSet } from "@/lib/interview-types";
import { useJd } from "@/lib/jd-store";
import { missingJdSkills } from "@/lib/live-checks";
import { buildSampleInterview } from "@/lib/sample-interview";

const TABS = ["All", "Behavioral", "Technical", "System Design"] as const;
const BADGE = {
  EASY: "border-pass/60 bg-pass/10 text-pass",
  MEDIUM: "border-warn/60 bg-warn/10 text-warn",
  HARD: "border-fail/60 bg-fail/10 text-fail",
};
const buttonClass = "border border-hair dark:border-white/15 text-sm px-4 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10";

function QuestionCard({
  q,
  practice,
  answerLabel,
  state,
  onHint,
  onReveal,
  onDraft,
}: {
  q: InterviewQuestion;
  practice: boolean;
  answerLabel: string;
  state: { hint: boolean; reveal: boolean; draft: string };
  onHint: () => void;
  onReveal: () => void;
  onDraft: (value: string) => void;
}) {
  const showAnswer = !practice || state.reveal;
  return (
    <article className="border border-hair dark:border-white/10 rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-3">
          <span className={`font-mono text-xs font-medium px-2 py-1 border rounded ${BADGE[q.lvl]}`}>{q.lvl}</span>
          <span className="text-xs font-medium text-muted dark:text-white/60">{q.cat}</span>
          {q.src && <span className="font-mono text-xs text-muted dark:text-white/40">· {q.src}</span>}
        </div>
        <h2 className="font-display font-bold text-lg leading-snug mb-4">{q.q}</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={onHint} aria-expanded={state.hint} className={buttonClass}>
            {state.hint ? "Hide hint" : "Show hint"}
          </button>
          {practice && (
            <button onClick={onReveal} className={buttonClass}>
              {state.reveal ? "Hide answer" : "Reveal answer"}
            </button>
          )}
        </div>
        {state.hint && (
          <p className="mt-4 text-sm border-l-2 border-action dark:border-[#5C86FF] pl-3 text-muted dark:text-white/60 leading-relaxed">{q.hint}</p>
        )}
        {practice && (
          <textarea
            rows={5}
            value={state.draft}
            onChange={(e) => onDraft(e.target.value)}
            placeholder="Type your answer here..."
            aria-label="Your answer"
            className="mt-5 w-full resize-y bg-transparent border border-hair dark:border-white/15 rounded-md px-4 py-3 text-sm leading-relaxed placeholder:text-muted/70 dark:placeholder:text-white/30 focus:outline-none focus:border-action"
          />
        )}
      </div>
      {showAnswer && (
        <div className="px-6 py-5 bg-black/[0.04] dark:bg-white/[0.04] border-t border-hair dark:border-white/10">
          <p className="font-mono text-xs text-muted dark:text-white/50 uppercase mb-3">{answerLabel}</p>
          <p className="leading-relaxed">{q.a}</p>
        </div>
      )}
    </article>
  );
}

export default function InterviewPrepPage() {
  const analysis = useAnalysis();
  const stored = useInterview();
  const jd = useJd();
  const github = useGithub();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [practice, setPractice] = useState(false);
  const [ui, setUi] = useState<Record<number, { hint: boolean; reveal: boolean; draft: string }>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (analysis === undefined || stored === undefined || jd === undefined || github === undefined) return <div className="px-5 sm:px-10 py-10" />;
  if (analysis === null) return <NeedsAnalysis what="Interview questions are written from the experience on your resume." />;

  const set: InterviewSet | null = stored && stored.analysisId === analysis.id ? stored : null;

  async function generate() {
    if (!analysis) return;
    setError(null);
    if (analysis.source === "sample") {
      saveInterview(buildSampleInterview());
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysis.id,
          resumeText: analysis.resumeText,
          targetRole: analysis.targetRole,
          skills: analysis.skills,
          missingSkills: missingJdSkills(analysis, jd),
          repos: github?.topRepos.map((r) => r.name) ?? [],
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Please try again.");
      setUi({});
      saveInterview(json.set as InterviewSet);
    } catch (err) {
      setError(err instanceof TypeError ? "Could not reach the server. Check your connection and try again." : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const patch = (id: number, change: Partial<{ hint: boolean; reveal: boolean; draft: string }>) =>
    setUi((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { hint: false, reveal: false, draft: "" }), ...change } }));

  const toggle = (
    <div className="flex items-center gap-3">
      <span id="practice-label" className="text-sm text-muted dark:text-white/50">
        Practice mode
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={practice}
        aria-labelledby="practice-label"
        onClick={() => setPractice(!practice)}
        className={`relative w-11 h-6 rounded-full transition-colors ${practice ? "bg-action" : "bg-black/15 dark:bg-white/20"}`}
      >
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: practice ? "translateX(20px)" : "none" }} />
      </button>
    </div>
  );

  if (!set) {
    return (
      <div>
        <PageHeader title="Interview Prep" crumb="Interview Prep" />
        <div className="px-5 sm:px-10 py-10 max-w-2xl mx-auto">
          {error && (
            <div role="alert" className="border border-fail/30 bg-fail/5 text-fail text-sm rounded-lg p-4 mb-4">
              {error}
            </div>
          )}
          <div className="border border-dashed border-hair dark:border-white/15 rounded-lg p-10 text-center">
            <p className="font-display font-bold text-lg mb-1">Build your question set</p>
            <p className="text-sm text-muted dark:text-white/50 mb-6">
              Nine questions drawn from your resume, your skill gaps and your public repositories, each with a hint and a model answer.
            </p>
            <button
              onClick={generate}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {busy ? "Writing questions" : "Generate questions"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = set.questions.filter((q) => tab === "All" || q.cat === tab);
  const answerLabel = set.source === "template" ? "Answer outline" : "Model answer";

  return (
    <div>
      <PageHeader title="Interview Prep" crumb="Interview Prep" actions={toggle} />
      <div className="px-5 sm:px-10 py-3 border-b border-hair dark:border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={t === tab}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm whitespace-nowrap ${
                t === tab ? "bg-ink text-white dark:bg-white dark:text-ink font-medium" : "text-muted dark:text-white/60 hover:text-ink dark:hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={busy} className="text-sm text-action dark:text-[#5C86FF] hover:underline whitespace-nowrap disabled:opacity-60">
          {busy ? "Writing…" : "Regenerate"}
        </button>
      </div>
      <div className="px-5 sm:px-10 py-8 max-w-4xl mx-auto space-y-6">
        {error && (
          <div role="alert" className="border border-fail/30 bg-fail/5 text-fail text-sm rounded-lg p-4">
            {error}
          </div>
        )}
        {set.warnings.map((w) => (
          <div key={w} role="status" className="border border-warn/30 bg-warn/5 text-warn text-sm rounded-lg px-4 py-3">
            {w}
          </div>
        ))}
        {set.source === "sample" && (
          <div className="border border-hair dark:border-white/15 text-sm text-muted dark:text-white/60 rounded-lg px-4 py-3">
            These are sample questions. Upload a resume to get questions about your own experience.
          </div>
        )}
        {items.map((q) => {
          const state = ui[q.id] ?? { hint: false, reveal: false, draft: "" };
          return (
            <QuestionCard
              key={q.id}
              q={q}
              practice={practice}
              answerLabel={answerLabel}
              state={state}
              onHint={() => patch(q.id, { hint: !state.hint })}
              onReveal={() => patch(q.id, { reveal: !state.reveal })}
              onDraft={(draft) => patch(q.id, { draft })}
            />
          );
        })}
      </div>
    </div>
  );
}
