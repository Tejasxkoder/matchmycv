import { NextResponse } from "next/server";
import { ADZUNA_COUNTRY, AdzunaError, searchJobs, type AdzunaJob } from "@/lib/adzuna";
import { detectSkills } from "@/server/analysis/signals";
import {
  scoreMatch,
  TRACKED_SKILLS,
  DEFAULT_RESUME_SKILLS,
} from "@/lib/job-match";
import { currencyForCountry } from "@/lib/salary";

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const LEVELS = ["Junior", "Mid", "Senior", "Staff"] as const;
const MIN_MATCH_PERCENT = 40;
const MAX_LISTINGS = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "software engineer";
  const where = searchParams.get("where") || undefined;
  const skillsParam = searchParams.get("skills");
  const resumeSkills = skillsParam
    ? skillsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_RESUME_SKILLS;
  const resumeSkillSet = new Set(resumeSkills.map((skill) => skill.toLowerCase()));
  const demandSkills = TRACKED_SKILLS
    .filter((skill) => resumeSkillSet.has(skill.toLowerCase()))
    .slice(0, 6);
  const skillsForDemand = demandSkills.length > 0 ? demandSkills : DEFAULT_RESUME_SKILLS;

  try {
    const [main, skillDemand, salaryBandResults, last7, last14] = await Promise.all([
      searchJobs({
        what: role,
        titleOnly: role,
        where,
        resultsPerPage: 50,
        maxDaysOld: 30,
      }).then((result) =>
        result.results.length > 0
          ? result
          : searchJobs({ what: role, where, resultsPerPage: 50, maxDaysOld: 30 })
      ),
      Promise.all(
        skillsForDemand.map((skill) =>
          searchJobs({ what: skill, where, resultsPerPage: 1 }).then((r) => ({ skill, count: r.count }))
        )
      ),
      Promise.all(
        LEVELS.map((level) => {
          const query = level === "Mid" ? role : `${level} ${role}`;
          return searchJobs({
            what: query,
            titleOnly: query,
            where,
            resultsPerPage: 20,
            maxDaysOld: 30,
          }).then((r) => ({
            level,
            jobs: r.results,
          }));
        })
      ),
      searchJobs({ what: role, titleOnly: role, where, resultsPerPage: 1, maxDaysOld: 7 }).then((r) => r.count),
      searchJobs({ what: role, titleOnly: role, where, resultsPerPage: 1, maxDaysOld: 14 }).then((r) => r.count),
    ]);

    const listings = main.results
      .map((job: AdzunaJob) => {
        const jobSkills = detectSkills(`${job.title}\n${job.description}`);
        return {
          postedAt: job.created,
          title: job.title,
          company: job.company?.display_name ?? "Unknown",
          location: job.location?.display_name ?? "—",
          salaryMin:
            typeof job.salary_min === "number" && Number.isFinite(job.salary_min)
              ? job.salary_min
              : null,
          salaryMax:
            typeof job.salary_max === "number" && Number.isFinite(job.salary_max)
              ? job.salary_max
              : null,
          postedAgo: timeAgo(job.created),
          tags: jobSkills.slice(0, 4),
          matchPercent: scoreMatch(resumeSkills, jobSkills),
          url: job.redirect_url,
        };
      })
      .filter((job) => job.matchPercent >= MIN_MATCH_PERCENT)
      .sort((a, b) => b.matchPercent - a.matchPercent || Date.parse(b.postedAt) - Date.parse(a.postedAt))
      .slice(0, MAX_LISTINGS);

    const salaryBands = salaryBandResults.map(({ level, jobs }) => {
      const mins = jobs
        .map((j) => j.salary_min)
        .filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);
      const maxs = jobs
        .map((j) => j.salary_max)
        .filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);
      if (mins.length === 0) return { level, min: null, max: null, median: null, sample: 0 };
      const sortedMins = [...mins].sort((a, b) => a - b);
      return {
        level,
        min: Math.round(Math.min(...mins)),
        max: Math.round(Math.max(...(maxs.length ? maxs : mins))),
        median: Math.round(sortedMins[Math.floor(sortedMins.length / 2)]),
        sample: mins.length,
      };
    });

    const prevWeek = Math.max(last14 - last7, 0);
    const changePercent = prevWeek > 0 ? Math.round(((last7 - prevWeek) / prevWeek) * 100) : null;

    return NextResponse.json({
      role,
      currency: currencyForCountry(ADZUNA_COUNTRY),
      totalActive: main.count,
      matchCount: listings.length,
      listings,
      skillDemand,
      salaryBands,
      momentum: { postedLast7Days: last7, postedPrevious7Days: prevWeek, changePercent },
    });
  } catch (err) {
    if (err instanceof AdzunaError && err.status === 429) {
      return NextResponse.json(
        { error: "Adzuna is temporarily rate-limiting job searches. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error fetching job market data" },
      { status: 500 }
    );
  }
}
