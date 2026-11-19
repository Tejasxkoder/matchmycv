export const TRACKED_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Node.js",
  "Express.js",
  "REST APIs",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "Python",
  "AWS",
  "Go",
  "Rust",
  "GraphQL",
  "Terraform",
];

export const DEFAULT_RESUME_SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Docker",
];

function normalize(text: string): string {
  return text.toLowerCase();
}

export function scoreMatch(resumeSkills: string[], jobSkills: string[]): number {
  const requiredSkills = [...new Set(jobSkills.map((skill) => normalize(skill.trim())).filter(Boolean))];
  if (requiredSkills.length === 0) return 0;
  const resumeSkillSet = new Set(resumeSkills.map((skill) => normalize(skill.trim())));
  const matches = requiredSkills.filter((skill) => resumeSkillSet.has(skill)).length;
  return Math.round((matches / requiredSkills.length) * 100);
}

export function experienceLevel(title: string): "Junior" | "Mid" | "Senior" | "Staff" {
  const t = normalize(title);
  if (/(staff|principal)/.test(t)) return "Staff";
  if (/senior|sr\.?\s/.test(t)) return "Senior";
  if (/junior|jr\.?\s|entry.level/.test(t)) return "Junior";
  return "Mid";
}
