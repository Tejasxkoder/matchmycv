# Testing checklist

## Automated (npm test)

77 tests. `tests/real-resume.test.ts` runs the whole pipeline on a real resume (`tests/data/tejas-resume.txt`), with the AI mocked.

## Manual, before every demo or deploy

Use `tests/data/tejas-resume.pdf` or your own resume. Keys must be set in `.env.local`.

1. Upload the PDF. Dashboard shows 8 checks. Expect Keyword Density pass, Format pass, Quantification fail, GitHub / JD Match / Skill Gap pending.
2. Upload a DOCX and a TXT version. Same skills should be found.
3. Upload a PNG renamed to .pdf, and a file over 4 MB. Both must show a clear error, not a crash.
4. Paste fewer than 200 characters in the text tab. The button stays disabled.
5. Remove OPENROUTER_API_KEY and run again. Checks still appear, with a warning banner.
6. Resume Analysis: accept two rewrites, reject one, press "Apply accepted changes". The downloaded text has the accepted lines, and `[X]` placeholders are flagged.
7. JD Match: paste the job description from the section below. Score appears, dashboard JD Match and Skill Gap are no longer pending.
8. Skill Gap: Kubernetes-style gaps appear as red nodes, zoom and pan work, resource links open.
9. Credibility: enter your GitHub username. Repos, stars and heatmap load. A wrong username shows "No GitHub user with that name".
10. Interview Prep: generate, switch tabs, turn on practice mode, reveal an answer.
11. Versions: upload a second time, compare v1 and v2.
12. Profile: save a name and target role, refresh the page, values stay. Job Market uses the target role.
13. Dark mode toggle on every page. Resize to a phone width and open the sidebar drawer.
14. Delete all resume data. Every page returns to its empty state.

## Sample job description

Backend Engineer

Requirements
- 2+ years of Node.js and TypeScript experience
- Experience with Docker and Kubernetes
- Strong SQL and PostgreSQL skills
- Experience with AWS or GCP
- Experience designing REST APIs

Nice to have
- Experience with Kafka or similar event streaming systems
