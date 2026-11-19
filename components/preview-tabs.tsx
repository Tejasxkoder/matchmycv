"use client";

import { useState } from "react";

type Tone = "pass" | "warn" | "fail";

const toneText: Record<Tone, string> = { pass: "text-pass", warn: "text-warn", fail: "text-fail" };
const toneBadge: Record<Tone, string> = { pass: "bg-pass/10 text-pass", warn: "bg-warn/10 text-warn", fail: "bg-fail/10 text-fail" };
const toneBorder: Record<Tone, string> = { pass: "border-l-pass", warn: "border-l-warn", fail: "border-l-fail" };

function Dashboard() {
  const rows: [string, string, Tone, string][] = [
    ["ATS Compatibility", "tables, columns, symbols", "warn", "3 formatting issues may block parsing"],
    ["Quantification", "missing numbers, percentages", "fail", "8 of 11 bullets lack measurable impact"],
    ["Keyword Density", "React, TypeScript, Node.js", "pass", "14 skills detected"],
    ["Format Compliance", "length, sections, contact", "pass", "All structural checks pass"],
    ["JD Match", "Senior Software Engineer", "warn", "67% match for the pasted role"],
  ];
  return (
    <div className="border border-hair dark:border-white/10 rounded-lg overflow-hidden">
      {rows.map(([title, sub, tone, detail]) => (
        <div key={title} className={`grid sm:grid-cols-[1.3fr_0.5fr_1.6fr] gap-2 px-4 py-3 border-l-4 border-t first:border-t-0 border-hair dark:border-white/10 ${toneBorder[tone]}`}>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="font-mono text-xs text-muted dark:text-white/40">{sub}</p>
          </div>
          <div>
            <span className={`font-mono text-xs px-2 py-0.5 rounded ${toneBadge[tone]}`}>{tone.toUpperCase()}</span>
          </div>
          <p className="text-sm text-muted dark:text-white/60">{detail}</p>
        </div>
      ))}
    </div>
  );
}

function Resume() {
  const rows: [string, string, string][] = [
    ["Worked on improving system performance.", "Reduced API p99 latency from [X]ms to [Y]ms by introducing [technique].", "QUANTIFY"],
    ["Aggressive approach to problem-solving.", "Methodical approach to problem-solving.", "TONE"],
    ["Skills: React, TS, Node, Postgres", "Skills: React, TypeScript, Node.js, PostgreSQL", "ATS"],
  ];
  return (
    <div className="space-y-3">
      {rows.map(([from, to, tag]) => (
        <div key={tag} className="border border-hair dark:border-white/10 border-l-4 border-l-warn rounded-lg px-4 py-3">
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-warn/10 text-warn">{tag}</span>
          <p className="text-sm text-muted dark:text-white/50 line-through mt-2">{from}</p>
          <p className="text-sm font-medium mt-1">{to}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs border border-pass/40 text-pass rounded px-2.5 py-1">Accept</span>
            <span className="text-xs border border-hair dark:border-white/15 rounded px-2.5 py-1 text-muted dark:text-white/60">Reject</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Jd() {
  const rows: [string, string, Tone, string][] = [
    ["5+ years of backend engineering experience", "MATCH", "pass", "6 years building distributed systems"],
    ["Proficiency in Go or Rust", "MISSING", "fail", "Not found in resume"],
    ["Experience with Kubernetes", "PARTIAL", "warn", "Docker is present but Kubernetes is not"],
  ];
  return (
    <div>
      <div className="bg-[#0d1016] rounded-lg px-4 py-4 flex items-center gap-6 mb-3">
        <div>
          <p className="font-mono text-xs text-white/40 mb-1">MATCH SCORE</p>
          <p className="font-display font-bold text-3xl text-warn">50%</p>
        </div>
        <p className="text-warn font-medium ml-auto">Apply after filling gaps</p>
      </div>
      <div className="border border-hair dark:border-white/10 rounded-lg overflow-hidden">
        {rows.map(([req, label, tone, note]) => (
          <div key={req} className={`border-l-4 border-t first:border-t-0 border-hair dark:border-white/10 px-4 py-3 ${toneBorder[tone]}`}>
            <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${toneBadge[tone]}`}>{label}</span>
            <p className="text-sm font-medium mt-2">{req}</p>
            <p className="text-xs text-muted dark:text-white/50 mt-1">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Market() {
  const rows: [string, string, string, number][] = [
    ["Backend Engineer", "Northwind · Remote", "$140k to $175k", 82],
    ["Platform Engineer", "Contoso · New York", "$150k to $190k", 64],
    ["Full Stack Engineer", "Fabrikam · Austin", "$125k to $160k", 58],
  ];
  return (
    <div className="border border-hair dark:border-white/10 rounded-lg overflow-hidden">
      {rows.map(([title, company, pay, match]) => (
        <div key={title} className="flex items-center justify-between gap-4 px-4 py-3 border-t first:border-t-0 border-hair dark:border-white/10">
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted dark:text-white/50">{company}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-muted dark:text-white/50">{pay}</p>
            <p className={`font-mono text-sm font-medium ${match >= 75 ? "text-pass" : "text-warn"}`}>{match}% match</p>
          </div>
        </div>
      ))}
      <p className="px-4 py-2 text-xs text-muted dark:text-white/40 bg-black/[0.03] dark:bg-white/[0.04]">Example listings. The real page loads live postings.</p>
    </div>
  );
}

function Skill() {
  const skills: [string, Tone][] = [
    ["TypeScript", "pass"],
    ["React", "pass"],
    ["Node.js", "pass"],
    ["Docker", "warn"],
    ["Redis", "warn"],
    ["Kubernetes", "fail"],
    ["Terraform", "fail"],
    ["AWS", "fail"],
  ];
  const border: Record<Tone, string> = { pass: "border-pass text-pass bg-pass/10", warn: "border-warn text-warn bg-warn/10", fail: "border-fail text-fail bg-fail/10" };
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        {skills.map(([name, tone]) => (
          <span key={name} className={`font-mono text-sm font-bold border-2 rounded-md px-4 py-3 ${border[tone]}`}>
            {name}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted dark:text-white/60">Docker → Kubernetes, AWS → Terraform. Dashed edges mark the gaps to close, in order.</p>
    </div>
  );
}

function Credibility() {
  return (
    <div>
      <div className="grid grid-cols-3 border border-hair dark:border-white/10 rounded-lg overflow-hidden mb-4">
        {[["Public repos", "23"], ["Stars", "847"], ["Followers", "312"]].map(([label, value], i) => (
          <div key={label} className={`px-4 py-3 ${i ? "border-l border-hair dark:border-white/10" : ""}`}>
            <p className="text-xs text-muted dark:text-white/50 mb-1">{label}</p>
            <p className="font-mono text-xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {["✓ TypeScript · 19 repos", "✓ React · 14 repos", "Kubernetes · not seen"].map((chip, i) => (
          <span key={chip} className={`font-mono text-xs px-2 py-1 rounded border ${i < 2 ? "border-pass/30 bg-pass/10 text-pass" : "border-hair dark:border-white/15 text-muted dark:text-white/50"}`}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function Interview() {
  return (
    <article className="border border-hair dark:border-white/10 rounded-lg p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-xs px-2 py-1 border rounded border-warn/60 bg-warn/10 text-warn">MEDIUM</span>
        <span className="text-xs text-muted dark:text-white/60">Technical</span>
        <span className="font-mono text-xs text-muted dark:text-white/40">· Redis caching</span>
      </div>
      <h3 className="font-display font-bold text-lg leading-snug mb-3">How would you prevent a cache stampede when a hot key expires?</h3>
      <p className="text-sm border-l-2 border-action pl-3 text-muted dark:text-white/60">Make only one caller rebuild the value, and avoid every key expiring at the same moment.</p>
    </article>
  );
}

const PANELS: Record<string, { url: string; node: React.ReactNode }> = {
  dashboard: { url: "matchmycv.app/dashboard", node: <Dashboard /> },
  resume: { url: "matchmycv.app/resume-analysis", node: <Resume /> },
  jd: { url: "matchmycv.app/jd-match", node: <Jd /> },
  market: { url: "matchmycv.app/job-market", node: <Market /> },
  skill: { url: "matchmycv.app/skill-roadmap", node: <Skill /> },
  cred: { url: "matchmycv.app/credibility", node: <Credibility /> },
  interview: { url: "matchmycv.app/interview-prep", node: <Interview /> },
};

function Frame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-paper dark:bg-[#0B0D11] shadow-xl">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-hair dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03]">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-fail/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-warn/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-pass/80" />
        </div>
        <span className="mx-auto font-mono text-xs text-muted dark:text-white/40 px-3 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.05]">{url}</span>
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="p-4 sm:p-6 min-h-[430px]">{children}</div>
    </div>
  );
}

const FEATURE_TABS = [
  ["dashboard", "Dashboard"],
  ["resume", "Resume Analysis"],
  ["jd", "JD Match"],
  ["market", "Job Market"],
  ["skill", "Skill Gap"],
] as const;

const STAGES = [
  ["dashboard", "Dashboard", "Pass, warn, fail at a glance"],
  ["resume", "Resume analysis", "Accept or reject each rewrite"],
  ["jd", "JD match", "Line-by-line verdict"],
  ["market", "Job market", "Live postings and salaries"],
  ["skill", "Skill gap", "What to learn, in order"],
  ["cred", "Credibility", "Claims checked on GitHub"],
  ["interview", "Interview prep", "Questions from your resume"],
] as const;

export function FeatureTabs() {
  const [active, setActive] = useState<string>("dashboard");
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-2xl mb-8">
        <h2 className="font-display font-bold text-3xl mb-3">See every stage of the run</h2>
        <p className="text-muted dark:text-white/60">Click through the screens. Each tab is a page inside MatchMyCV.</p>
      </div>
      <div className="rounded-2xl bg-action/[0.07] dark:bg-white/[0.04] border border-action/10 dark:border-white/10 p-4 sm:p-6">
        <div className="overflow-x-auto pb-1 mb-4">
          <div role="tablist" className="inline-flex min-w-full sm:flex sm:justify-between gap-1 p-1.5 rounded-full bg-action/10 dark:bg-white/5 border border-action/10 dark:border-white/10">
            {FEATURE_TABS.map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={active === key}
                onClick={() => setActive(key)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  active === key ? "bg-white dark:bg-[#0d1016] text-ink dark:text-white shadow-sm" : "text-ink/70 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Frame url={PANELS[active].url}>{PANELS[active].node}</Frame>
      </div>
    </section>
  );
}

export function StageTabs() {
  const [active, setActive] = useState<string>("dashboard");
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 border-t border-hair dark:border-white/10">
      <div className="max-w-2xl mb-8">
        <h2 className="font-display font-bold text-3xl mb-3">Seven stages, one pipeline</h2>
        <p className="text-muted dark:text-white/60">Every analysis moves through the same stages, from upload to interview.</p>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div role="tablist" aria-orientation="vertical" className="border border-hair dark:border-white/10 rounded-xl p-2 flex flex-col gap-0.5">
          {STAGES.map(([key, label, desc], i) => {
            const on = active === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(key)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${on ? "bg-action/[0.07] dark:bg-white/[0.07]" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      on ? "bg-action text-white" : "border border-hair dark:border-white/20 text-muted dark:text-white/50"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-sm ${on ? "font-medium text-ink dark:text-white" : "text-muted dark:text-white/60"}`}>{label}</span>
                </span>
                {on && <span className="block text-xs text-muted dark:text-white/50 mt-1 ml-8">{desc}</span>}
              </button>
            );
          })}
        </div>
        <Frame url={PANELS[active].url}>{PANELS[active].node}</Frame>
      </div>
    </section>
  );
}
