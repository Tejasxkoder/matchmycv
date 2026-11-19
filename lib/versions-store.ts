import { createStore } from "./store";
import type { Check, CheckStatus } from "./analysis-types";

export type VersionEntry = {
  id: string;
  runNumber: number;
  fileName: string;
  createdAt: string;
  words: number;
  resumeText: string;
  checks: { id: string; title: string; status: CheckStatus }[];
};

const MAX_VERSIONS = 20;
const store = createStore<VersionEntry[]>("matchmycv-versions");

export const useVersions = store.useValue;

function snapshot(checks: Check[]) {
  return checks.map((c) => ({ id: c.id, title: c.title, status: c.status }));
}

export function pushVersion(entry: Omit<VersionEntry, "checks"> & { checks: Check[] }) {
  const list = store.read() ?? [];
  const next = [{ ...entry, checks: snapshot(entry.checks) }, ...list.filter((v) => v.id !== entry.id)];
  store.write(next.slice(0, MAX_VERSIONS));
}

export function syncLatestChecks(id: string, checks: Check[]) {
  const list = store.read();
  if (!list || list.length === 0 || list[0].id !== id) return;
  const next = snapshot(checks);
  if (JSON.stringify(list[0].checks) === JSON.stringify(next)) return;
  store.write([{ ...list[0], checks: next }, ...list.slice(1)]);
}

export function clearVersions() {
  store.write(null);
}

export function tally(checks: VersionEntry["checks"]) {
  const out = { pass: 0, warn: 0, fail: 0, pending: 0 };
  for (const c of checks) out[c.status] += 1;
  return out;
}
