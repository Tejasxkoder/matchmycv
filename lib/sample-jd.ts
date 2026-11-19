import type { JdAnalysis, JdRequirement } from "./jd-types";
import { scoreRequirements } from "./jd-types";

const rows: Omit<JdRequirement, "id">[] = [
  { text: "5+ years of backend engineering experience", kind: "required", verdict: "match", evidence: "Led development of features for the product.", note: "Confirmed in your resume" },
  { text: "Proficiency in Go or Rust", kind: "required", verdict: "missing", evidence: null, note: "Not found in resume. You list TypeScript and Node.js." },
  { text: "Experience with Kubernetes and container orchestration", kind: "required", verdict: "partial", evidence: "Skills: React, TS, Node, Postgres, Docker", note: "Docker is present but Kubernetes is not." },
  { text: "Strong SQL and database design skills", kind: "required", verdict: "match", evidence: "Skills: React, TS, Node, Postgres, Docker", note: "Confirmed in your resume" },
  { text: "Experience designing REST APIs", kind: "required", verdict: "partial", evidence: "Built a recommendation engine for the platform.", note: "Weak match. Name the APIs and who consumed them." },
  { text: "Comfortable in a high-velocity, on-call environment", kind: "required", verdict: "missing", evidence: null, note: "No mention of on-call, incident response or SLAs." },
  { text: "Experience with Kafka or similar event streaming systems", kind: "nice", verdict: "missing", evidence: null, note: "Not found in resume: Kafka." },
];

export function buildSampleJd(jdText: string, title: string, company: string): JdAnalysis {
  const requirements = rows.map((r, i) => ({ id: i + 1, ...r }));
  return {
    id: "sample-jd",
    title: title.trim() || "Senior Software Engineer",
    company: company.trim() || "Sample Co",
    jdText,
    score: scoreRequirements(requirements).score,
    createdAt: new Date().toISOString(),
    source: "ai",
    model: "sample data",
    requirements,
    requiredSkills: ["Go", "Rust", "Kubernetes", "SQL", "Kafka"],
    warnings: ["This is a sample run, so the requirements shown are made-up examples and not read from your text."],
  };
}
