import { SKILLS } from "../server/analysis/skills-vocab";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

const BY_NAME = new Map(SKILLS.map((def) => [def.name.toLowerCase(), def]));

export function skillRegex(name: string, flags = ""): RegExp {
  const def = BY_NAME.get(name.toLowerCase());
  const names = [name, ...(def?.aliases ?? [])].map(escapeRe).join("|");
  const caseFlag = def?.caseSensitive ? "" : "i";
  return new RegExp(`(?<![A-Za-z0-9+#.])(?:${names})(?![A-Za-z0-9+#]|\\.[A-Za-z])`, caseFlag + flags);
}

export function mentionCount(text: string, name: string): number {
  return (text.match(skillRegex(name, "g")) ?? []).length;
}

export function lineMentioning(text: string, name: string): string | null {
  const re = skillRegex(name);
  const line = text.split("\n").find((l) => re.test(l));
  return line ? line.trim() : null;
}

export function findGithubUsername(text: string): string | null {
  const match = text.match(/github\.com\/([A-Za-z0-9-]{1,39})(?![A-Za-z0-9-])/i);
  return match ? match[1] : null;
}
