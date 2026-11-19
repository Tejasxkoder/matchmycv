import type { Analysis } from "./analysis-types";
import { githubEvidence, type GithubSnapshot } from "./github-types";
import type { StoredJd } from "./jd-types";
import { mentionCount } from "./skill-match";

export type SkillStatus = "verified" | "partial" | "missing";

export type GraphNode = {
  name: string;
  status: SkillStatus;
  detail: string;
  x: number;
  y: number;
};

export type GraphEdge = { from: string; to: string; gap: boolean };

export type SkillGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  bounds: { x: number; y: number; w: number; h: number };
  counts: Record<SkillStatus, number>;
};

export const NODE_W = 112;
export const NODE_H = 50;
const COL_GAP = 200;
const ROW_GAP = 100;
const MAX_ROWS = 6;

const PREREQS: Record<string, string[]> = {
  TypeScript: ["JavaScript"],
  React: ["JavaScript"],
  "Next.js": ["React"],
  Redux: ["React"],
  "Vue.js": ["JavaScript"],
  Angular: ["TypeScript"],
  "Node.js": ["JavaScript"],
  "Express.js": ["Node.js"],
  GraphQL: ["REST APIs"],
  PostgreSQL: ["SQL"],
  MySQL: ["SQL"],
  Docker: ["Linux"],
  Kubernetes: ["Docker"],
  Terraform: ["AWS"],
  "GitHub Actions": ["Git"],
  "CI/CD": ["Git"],
  Django: ["Python"],
  Flask: ["Python"],
  FastAPI: ["Python"],
  Pandas: ["Python"],
  PyTorch: ["Python"],
  TensorFlow: ["Python"],
  "Spring Boot": ["Java"],
  Kafka: ["Microservices"],
  Grafana: ["Prometheus"],
};

export function buildSkillGraph(
  analysis: Analysis,
  jd: StoredJd | null | undefined,
  github: GithubSnapshot | null | undefined
): SkillGraph {
  const status = new Map<string, { status: SkillStatus; detail: string }>();

  for (const skill of analysis.skills) {
    const repos = github ? githubEvidence(github, skill) : 0;
    const mentions = mentionCount(analysis.resumeText, skill);
    if (repos > 0) status.set(skill, { status: "verified", detail: `Seen in ${repos} public ${repos === 1 ? "repo" : "repos"} on GitHub.` });
    else if (mentions >= 2) status.set(skill, { status: "verified", detail: `Mentioned ${mentions} times across your resume.` });
    else status.set(skill, { status: "partial", detail: "Listed once, with no supporting detail or public project." });
  }

  const wanted = jd && jd.analysisId === analysis.id ? jd.requiredSkills : [];
  for (const skill of wanted) {
    if (status.has(skill)) continue;
    const prereq = (PREREQS[skill] ?? []).find((p) => status.has(p));
    status.set(skill, {
      status: "missing",
      detail: prereq
        ? `Named in the job description. ${prereq} is on your resume but ${skill} is not.`
        : "Named in the job description but not found in your resume.",
    });
  }

  const names = [...status.keys()];
  const edges: GraphEdge[] = [];
  for (const name of names) {
    for (const p of PREREQS[name] ?? []) {
      if (status.has(p)) {
        edges.push({ from: p, to: name, gap: status.get(p)!.status === "missing" || status.get(name)!.status === "missing" });
      }
    }
  }

  const depth = new Map<string, number>();
  const visit = (name: string, trail: Set<string>): number => {
    if (depth.has(name)) return depth.get(name)!;
    if (trail.has(name)) return 0;
    trail.add(name);
    const parents = (PREREQS[name] ?? []).filter((p) => status.has(p));
    const d = parents.length ? Math.max(...parents.map((p) => visit(p, trail))) + 1 : 0;
    trail.delete(name);
    depth.set(name, d);
    return d;
  };
  names.forEach((n) => visit(n, new Set()));

  const order = { verified: 0, partial: 1, missing: 2 };
  const layers = new Map<number, string[]>();
  for (const name of names) {
    const d = depth.get(name) ?? 0;
    layers.set(d, [...(layers.get(d) ?? []), name]);
  }

  const nodes: GraphNode[] = [];
  let column = 0;
  for (const d of [...layers.keys()].sort((a, b) => a - b)) {
    const members = layers.get(d)!.sort((a, b) => order[status.get(a)!.status] - order[status.get(b)!.status] || a.localeCompare(b));
    const subColumns = Math.ceil(members.length / MAX_ROWS);
    members.forEach((name, i) => {
      const sub = Math.floor(i / MAX_ROWS);
      const row = i % MAX_ROWS;
      const rowsInSub = Math.min(MAX_ROWS, members.length - sub * MAX_ROWS);
      const info = status.get(name)!;
      nodes.push({
        name,
        status: info.status,
        detail: info.detail,
        x: 110 + (column + sub) * COL_GAP,
        y: 50 + row * ROW_GAP + ((MAX_ROWS - rowsInSub) * ROW_GAP) / 2,
      });
    });
    column += subColumns;
  }

  const counts: Record<SkillStatus, number> = { verified: 0, partial: 0, missing: 0 };
  nodes.forEach((n) => (counts[n.status] += 1));

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0) - NODE_W / 2;
  const minY = Math.min(...ys, 0) - NODE_H / 2;
  const bounds = nodes.length
    ? { x: minX, y: minY, w: Math.max(...xs) + NODE_W / 2 - minX, h: Math.max(...ys) + NODE_H / 2 - minY }
    : { x: 0, y: 0, w: 1, h: 1 };

  return { nodes, edges, bounds, counts };
}
