"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAnalysis } from "@/lib/analysis-store";
import { useProfile } from "@/lib/profile-store";
import { formatAnnualSalary, formatAnnualSalaryRange } from "@/lib/salary";

type Listing = {
  postedAt: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  postedAgo: string;
  tags: string[];
  matchPercent: number;
  url: string;
};
type SkillDemand = { skill: string; count: number };
type SalaryBand = {
  level: string;
  min: number | null;
  max: number | null;
  median: number | null;
  sample: number;
};
type JobMarketData = {
  role: string;
  currency: string;
  totalActive: number;
  matchCount: number;
  listings: Listing[];
  skillDemand: SkillDemand[];
  salaryBands: SalaryBand[];
  momentum: {
    postedLast7Days: number;
    postedPrevious7Days: number;
    changePercent: number | null;
  };
};

type SortMode = "match" | "recent" | "salary";

export default function JobMarketPage() {
  const [data, setData] = useState<JobMarketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("match");

  const analysis = useAnalysis();
  const profile = useProfile();
  const role = profile.targetRole.trim() || analysis?.targetRole || "software engineer";
  const where = profile.locations.trim();
  const skills = analysis?.skills.join(",") ?? "";

  useEffect(() => {
    if (analysis === undefined) return;
    setLoading(true);
    const query = new URLSearchParams({ role });
    if (skills) query.set("skills", skills);
    if (where) query.set("where", where);
    fetch(`/api/job-market?${query.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [analysis, role, skills, where]);

  const sortedListings = data
    ? [...data.listings].sort((a, b) => {
        if (sort === "match") return b.matchPercent - a.matchPercent;
        if (sort === "salary") return (b.salaryMax ?? 0) - (a.salaryMax ?? 0);
      return Date.parse(b.postedAt) - Date.parse(a.postedAt);
      })
    : [];

  const maxSkillCount = data ? Math.max(...data.skillDemand.map((s) => s.count), 1) : 1;
  const maxSalary = data ? Math.max(...data.salaryBands.map((b) => b.max ?? 0), 1) : 1;

  return (
    <div className="px-5 sm:px-10 py-8 sm:py-10">
      <p className="text-sm text-muted dark:text-white/50 mb-2">
        <Link href="/dashboard" className="hover:text-ink dark:hover:text-white transition-colors">
          Dashboard
        </Link>{" "}
        / <span className="text-ink dark:text-white">Job Market</span>
      </p>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h1 className="font-display font-bold text-2xl sm:text-3xl">Job Market</h1>
        <div className="flex items-center gap-4">
          {data && (
            <span className="text-sm text-muted dark:text-white/50 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-pass" aria-hidden="true" />
              {data.matchCount} matching · {data.totalActive.toLocaleString()} active postings
            </span>
          )}
        </div>
      </div>

      {analysis !== undefined && (
        <p className="text-sm text-muted dark:text-white/50 mb-4">
          {analysis
            ? `Comparing listings with ${analysis.skills.length} skills from run #${analysis.runNumber} for "${role}" roles.`
            : "Using sample skills. Upload a resume to match against your own."}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted dark:text-white/50">Fetching live postings from Adzuna…</p>
      )}

      {error && (
        <div className="border border-fail/30 bg-fail/5 text-fail text-sm rounded-lg p-4 mb-6">
          Couldn&apos;t load job market data: {error}
        </div>
      )}

      {data && (
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8">
          <div>
            <div className="inline-flex border border-hair dark:border-white/15 rounded-md overflow-hidden mb-4">
              {(["match", "recent", "salary"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSort(mode)}
                  className={`px-3 py-1.5 text-sm font-medium border-l border-hair dark:border-white/15 first:border-l-0 transition-colors ${
                    sort === mode
                      ? "bg-ink dark:bg-white text-white dark:text-ink"
                      : "text-muted dark:text-white/60 hover:text-ink dark:hover:text-white"
                  }`}
                >
                  {mode === "match" ? "Best match" : mode === "recent" ? "Most recent" : "Salary"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {sortedListings.map((job) => (
                <a
                  key={job.url}
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-hair dark:border-white/10 rounded-lg p-5 hover:border-black/30 dark:hover:border-white/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted dark:text-white/50">
                        {job.company} · {job.location}
                      </p>
                      <p className="text-sm text-muted dark:text-white/50 mt-1">
                        {job.salaryMin !== null && job.salaryMax !== null
                          ? formatAnnualSalaryRange(job.salaryMin, job.salaryMax, data.currency)
                          : "Salary not listed"}{" "}
                        · {job.postedAgo}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-display font-bold text-xl ${
                          job.matchPercent >= 75
                            ? "text-pass"
                            : job.matchPercent >= 50
                            ? "text-warn"
                            : "text-fail"
                        }`}
                      >
                        {job.matchPercent}%
                      </p>
                      <p className="text-xs text-muted dark:text-white/40">match</p>
                    </div>
                  </div>
                  {job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs border border-hair dark:border-white/15 rounded px-2 py-0.5 font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
              {sortedListings.length === 0 && (
                <p className="text-sm text-muted dark:text-white/50">
                  No recent postings reached a 40% skill match. Try broadening the role or location.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="font-semibold mb-1">Skill demand</h2>
              <p className="text-xs text-muted dark:text-white/50 mb-4">
                Live postings mentioning each skill
              </p>
              <div className="flex items-end gap-3 h-32">
                {data.skillDemand.map((s) => (
                  <div key={s.skill} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className="w-full bg-action/80 rounded-t"
                      style={{ height: `${Math.max((s.count / maxSkillCount) * 100, 4)}%` }}
                    />
                    <span className="text-[10px] font-mono text-muted dark:text-white/40">
                      {s.skill}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-4">Salary benchmark</h2>
              <div className="space-y-4">
                {data.salaryBands.map((b) => (
                  <div key={b.level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{b.level}</span>
                      <span className="text-muted dark:text-white/50">
                        {b.min !== null && b.max !== null
                          ? formatAnnualSalaryRange(b.min, b.max, data.currency)
                          : "No data"}
                      </span>
                    </div>
                    {b.min !== null && b.max !== null && (
                      <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 relative overflow-hidden">
                        <div
                          className="absolute h-full bg-action/40 rounded-full"
                          style={{
                            left: `${(b.min / maxSalary) * 100}%`,
                            width: `${((b.max - b.min) / maxSalary) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                    {b.median !== null && (
                      <p className="text-xs text-muted dark:text-white/40 mt-1 text-right">
                        median {formatAnnualSalary(b.median, data.currency)}
                        {data.currency === "INR" ? " LPA" : ""} · {b.sample} postings
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-1">Posting momentum</h2>
              <p className="text-xs text-muted dark:text-white/50 mb-3">
                &ldquo;{data.role}&rdquo; postings, week over week
              </p>
              <div className="border border-hair dark:border-white/10 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-2xl">{data.momentum.postedLast7Days}</p>
                  <p className="text-xs text-muted dark:text-white/50">posted this week</p>
                </div>
                {data.momentum.changePercent !== null ? (
                  <span
                    className={`font-mono text-sm ${
                      data.momentum.changePercent >= 0 ? "text-pass" : "text-fail"
                    }`}
                  >
                    {data.momentum.changePercent >= 0 ? "+" : ""}
                    {data.momentum.changePercent}%
                  </span>
                ) : (
                  <span className="text-xs text-muted dark:text-white/40">not enough data</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
