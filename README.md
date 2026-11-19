# MatchMyCV

AI resume analyzer — landing page, built with Next.js 15 (App Router), TypeScript, and Tailwind CSS.

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000, then fill in `.env.local` (see below).

## What works right now

This is the review 2 MVP. The flow that runs end to end:

1. **Upload** a PDF, DOCX or TXT (up to 4 MB), or paste your experience as text.
2. The server extracts the text and runs rule based checks on it: contact details, sections, recognised skills, bullets with numbers, gender coded and passive wording, layout problems.
3. The same text goes to an OpenRouter free model, which returns rewrite suggestions and a target role.
4. **Dashboard** shows the checks. **Resume Analysis** lets you accept or reject each rewrite, and "Apply accepted changes" downloads the improved resume as a text file.
5. **Job Market** uses the skills and target role found in your resume to fetch and score live postings from Adzuna.

6. **JD Match**: paste a job description. Each requirement is compared with your resume (AI first, keyword matching as the fallback) and scored. The result also fills the JD Match and Skill Gap checks on the dashboard.
7. **Skill Gap**: a pan and zoom graph of your skills (verified, partial, missing) with learning links for each gap.
8. **Credibility**: looks up your public GitHub profile (no login needed), shows recent activity, and checks which resume skills appear in your repos. You can also list certifications.
9. **Interview Prep**: nine questions with hints and model answers, written from your resume, skill gaps and repos. Practice mode hides the answers.
10. **Versions**: every run is saved, and any two can be compared check by check.
11. **Profile & Settings**: name, GitHub username, target role and location (used by Job Market), and display preferences.

The landing page now has the pipeline banner and the tabbed screen previews.

Results are kept in the browser (localStorage). There is no database or login yet.

## Setting up the free AI model

1. Create an account at https://openrouter.ai and make an API key.
2. Put it in `.env.local` as `OPENROUTER_API_KEY`.
3. In OpenRouter, open Settings, then Privacy, and allow free endpoints. Without this, free models can answer with a 404 about your data policy.
4. Start the app and upload a resume.

`OPENROUTER_MODELS` defaults to `openrouter/free`, a router that picks from whichever free models are live. To pin models, list their ids separated by commas, for example `OPENROUTER_MODELS=some-vendor/some-model:free,other-vendor/other-model:free`. The ids rotate, so check https://openrouter.ai/models and filter by free.

Things to know about free models:

- Free accounts are limited to 20 requests a minute and 50 a day (1,000 a day once you have bought $10 of credits). One analysis uses one request, or two if the first reply was not valid JSON. The app also limits each visitor to 6 analyses per 10 minutes.
- When the model is busy or rate limited, the analysis still finishes with the rule based checks and a warning banner. Rewrites are skipped, and you can run it again.
- Free endpoints may log prompts or use them for training. Use the sample resume or a resume without private details when you demo.
- Suggested rewrites never invent numbers. Where a figure is needed the model leaves a placeholder like `[X%]`, which is highlighted on the page, and the download reminds you to fill them in.

No key yet? Press "Open a sample run" on the upload page or dashboard to see the screens with made up data.

## Tests

```bash
npm test
```

70 tests cover JSON parsing of model replies, the rule based checks, validation of AI output, the OpenRouter client against mocked responses (rate limits, privacy errors, timeouts), the whole analyze pipeline, the upload endpoint with real multipart requests, JD matching, the GitHub lookup, interview questions, certificate status and the skill graph. PDF and DOCX extraction is injected in those tests, so try one real PDF and one DOCX yourself the first time.

## Stack

- **Next.js 15** (App Router) — routing and rendering
- **TypeScript** — type safety
- **Tailwind CSS** — styling, using the design tokens in `tailwind.config.ts`
- **lucide-react** — icons (pass/warn/fail check marks)
- **unpdf** and **mammoth** — text extraction from PDF and DOCX
- **OpenRouter** — free LLM for rewrite suggestions
- **next/font/google** — Space Grotesk (headings), Plus Jakarta Sans (body), JetBrains Mono (terminal/data)

## Design tokens

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FAFAF7` | page background |
| `ink` | `#14181F` | primary text, dark sections |
| `muted` | `#5B6069` | secondary text |
| `hair` | `#DADCD6` | hairline borders |
| `action` | `#2450E8` | primary actions, links |
| `pass` | `#3F8F5F` | passing check status |
| `warn` | `#C97A1A` | warning/attention status |
| `fail` | `#C4432E` | failing/mismatch status |

## Repo structure

```
matchmycv/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── api/
│   │   ├── analyze/route.ts        thin wrapper around server/handle-analyze.ts
│   │   └── job-market/route.ts     Adzuna listings, skill demand, salary bands
│   └── (app)/                      workspace pages sharing the sidebar shell
│       ├── upload, dashboard, resume-analysis, job-market
│       └── jd-match, skill-roadmap, credibility, interview-prep, versions, profile (placeholders)
├── components/                     UI pieces (sidebar, checks table, summary bar, landing sections)
├── lib/                            code the browser uses
│   ├── analysis-types.ts           types shared with the server
│   ├── analysis-store.ts           localStorage store and the useAnalysis hook
│   ├── apply-changes.ts            builds the improved resume text
│   ├── sample-analysis.ts          the "sample run" data
│   ├── adzuna.ts, job-match.ts     job market helpers
│   └── format.ts, nav-items.ts, utils.ts
├── server/                         code that only runs on the server
│   ├── handle-analyze.ts           request in, JSON out (upload endpoint logic)
│   ├── parsing/extract-text.ts     PDF, DOCX and TXT to plain text
│   ├── analysis/                   signals.ts (rule based), validate.ts, build-checks.ts, analyze.ts
│   ├── ai/                         openrouter.ts, prompts.ts, json.ts
│   └── rate-limit.ts
└── tests/                          npm test
```

## Responsive

Below the `md` breakpoint, `components/sidebar.tsx` becomes an off-canvas
drawer instead of a static column — `components/app-shell.tsx` holds the
open/close state and renders a mobile top bar (hamburger + wordmark) plus a
backdrop. Clicking a nav link, the backdrop, or the close (X) button closes
the drawer. The landing page's nav, hero heading, and section padding also
scale down at the `sm`/`md` breakpoints.

## Job Market backend (live data)

`app/api/job-market/route.ts` calls the [Adzuna](https://developer.adzuna.com) API
— free to register, low-volume tier is free. Set `ADZUNA_APP_ID` and
`ADZUNA_APP_KEY` in `.env.local` (copy `.env.local.example`), then
`/job-market` fetches real listings on load.

What's real vs. what's a deliberate simplification:
- **Listings, salary ranges, posted dates** — straight from Adzuna. Listings
  are limited to the last 30 days, prefer job titles matching the selected
  role, and fall back to a broader role search if there are no title hits.
  The page shows up to ten listings with at least a 40% recognized-skill
  match, ranked by match by default.
- **Match %** — computed locally (`lib/job-match.ts`) as the percentage of
  recognized skills in the posting that also appear in the resume. This is a
  keyword-based skill coverage score, not a semantic or seniority assessment.
  Pass your own list via `?skills=react,go,aws`. The page sends skills from the
  latest resume and falls back to sample skills when there is no run yet.
- **Skill demand** — real Adzuna posting counts for up to six tracked skills
  found in the current resume, fetched with one low-cost count-only query per
  skill. If no tracked skills are present, sample skills are used.
- **Salary benchmark** — real Adzuna results, bucketed into
  Junior/Mid/Senior/Staff by a title-keyword heuristic. This is *not* the
  same as company-internal leveling (L4/L5/...) — no public API exposes
  that; treat the bands as broad market ranges, not precise levels. Amounts
  use the configured Adzuna country's currency; India salaries are shown as
  annual LPA (lakhs per annum), not USD thousands.
  Sample size (`sample` on each band) is included so an obviously
  small/noisy bucket is visible.
- **"Posting momentum"** replaces the "competition density / applicants
  per role" idea from early mockups — no job board API exposes applicant
  counts (that data is private to LinkedIn/Indeed). Momentum instead
  compares postings in the last 7 days vs. the 7 days before that for the
  same query, which is real and honest, if a rougher signal.

An uncached page load needs roughly a dozen Adzuna searches (listings + 6
skills + 4 salary bands + 2 momentum windows). Successful searches are cached
for five minutes and duplicate in-flight searches are coalesced; outbound
requests are capped at three concurrent calls. This reduces repeat traffic and
bursts, but cannot bypass an Adzuna account quota—if the provider is already
returning 429, wait for its limit to reset before retrying.

## Dark mode

The toggle in the navbar (`components/theme-toggle.tsx`) uses the browser's
View Transitions API to animate a circle expanding from the button — the
same effect as most modern "reveal" theme toggles. It falls back to an
instant switch (no animation) in browsers without View Transitions support,
or when the user has `prefers-reduced-motion` set. Preference is saved to
`localStorage` and re-applied via an inline script in `app/layout.tsx` that
runs before paint, so there's no flash of the wrong theme on reload.

## Notes on the newer pages

- `GITHUB_TOKEN` in `.env.local` is optional. Without it GitHub allows 60 requests an hour per server IP. The public events feed only reaches back about 90 days, so the heatmap shows 13 weeks.
- Certificates are not verified with the issuer. ACTIVE means a credential link was entered and the expiry date has not passed.
- Notification switches are stored but nothing sends email yet. There is no account, so "Delete account" became "Reset profile and settings".
- With a sample run, JD Match and Interview Prep show made-up data and do not call the AI.

## Next steps

- Move results from localStorage to a database with a login, so versions can be kept.
- Cache the Adzuna calls before sending real traffic to the Job Market page.
