"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Heatmap } from "@/components/heatmap";
import { NeedsAnalysis } from "@/components/needs-analysis";
import { PageHeader } from "@/components/page-header";
import { useAnalysis } from "@/lib/analysis-store";
import { addCert, certStatus, removeCert, useCerts, type CertStatus } from "@/lib/certs-store";
import { saveGithub, useGithub } from "@/lib/github-store";
import { githubEvidence, type GithubSnapshot } from "@/lib/github-types";
import { useProfile } from "@/lib/profile-store";
import { findGithubUsername } from "@/lib/skill-match";
import { timeAgo } from "@/lib/format";

const certStyle: Record<CertStatus, { border: string; badge: string; label: string }> = {
  active: { border: "border-l-pass", badge: "border-pass/30 bg-pass/10 text-pass", label: "ACTIVE" },
  expired: { border: "border-l-fail", badge: "border-fail/30 bg-fail/10 text-fail", label: "EXPIRED" },
  unverified: { border: "border-l-warn", badge: "border-warn/30 bg-warn/10 text-warn", label: "NO LINK" },
};

const langStyle = ["bg-action/10 text-action dark:text-[#7B9CFF]", "bg-pass/10 text-pass", "bg-warn/10 text-warn"];

const inputClass =
  "w-full bg-transparent border border-hair dark:border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-action";

function Stat({ label, value, border }: { label: string; value: string; border?: string }) {
  return (
    <div className={`px-5 py-4 ${border ?? ""}`}>
      <p className="text-sm text-muted dark:text-white/50 mb-2">{label}</p>
      <p className="font-mono text-2xl sm:text-[28px] font-medium">{value}</p>
    </div>
  );
}

function CertForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", issuer: "", issued: "", expires: "", url: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        addCert({ ...form, name: form.name.trim(), issuer: form.issuer.trim(), url: form.url.trim() });
        onDone();
      }}
      className="border border-hair dark:border-white/10 rounded-lg p-5 mb-5 grid sm:grid-cols-2 gap-4"
    >
      <label className="block sm:col-span-2">
        <span className="block text-sm mb-1.5">Certificate name</span>
        <input required value={form.name} onChange={set("name")} className={inputClass} placeholder="AWS Solutions Architect – Associate" />
      </label>
      <label className="block">
        <span className="block text-sm mb-1.5">Issuer</span>
        <input value={form.issuer} onChange={set("issuer")} className={inputClass} placeholder="Amazon Web Services" />
      </label>
      <label className="block">
        <span className="block text-sm mb-1.5">Credential link</span>
        <input type="url" value={form.url} onChange={set("url")} className={inputClass} placeholder="https://" />
      </label>
      <label className="block">
        <span className="block text-sm mb-1.5">Issued</span>
        <input type="month" value={form.issued} onChange={set("issued")} className={`${inputClass} dark:[color-scheme:dark]`} />
      </label>
      <label className="block">
        <span className="block text-sm mb-1.5">Expires (optional)</span>
        <input type="month" value={form.expires} onChange={set("expires")} className={`${inputClass} dark:[color-scheme:dark]`} />
      </label>
      <div className="sm:col-span-2 flex justify-end gap-3">
        <button type="button" onClick={onDone} className="border border-hair dark:border-white/15 text-sm px-4 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10">
          Cancel
        </button>
        <button type="submit" className="bg-action text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-action/90">
          Save certificate
        </button>
      </div>
    </form>
  );
}

export default function CredibilityPage() {
  const analysis = useAnalysis();
  const github = useGithub();
  const certs = useCerts();
  const profile = useProfile();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const seeded = useRef(false);

  const guess = (profile.github || (analysis ? findGithubUsername(analysis.resumeText) : null) || "").replace(/^@/, "");

  useEffect(() => {
    if (!seeded.current && guess) {
      seeded.current = true;
      setUsername(guess);
    }
  }, [guess]);

  async function lookup(name: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/github?user=${encodeURIComponent(name)}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Please try again.");
      saveGithub(json.github as GithubSnapshot);
    } catch (err) {
      setError(err instanceof TypeError ? "Could not reach the server. Check your connection and try again." : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (analysis === undefined || github === undefined || certs === undefined) return <div className="px-5 sm:px-10 py-10" />;
  if (analysis === null) return <NeedsAnalysis what="The Credibility Center checks the skills on your resume against your public GitHub work." />;

  const verified = github ? analysis.skills.filter((s) => githubEvidence(github, s) > 0) : [];
  const unverified = github ? analysis.skills.filter((s) => githubEvidence(github, s) === 0) : [];

  return (
    <div>
      <PageHeader title="Credibility Center" crumb="Credibility" />
      <div className="px-5 sm:px-10 py-8 max-w-4xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (username.trim()) lookup(username.trim());
          }}
          className="flex flex-wrap items-end gap-3 mb-6"
        >
          <label className="block flex-1 min-w-[220px]">
            <span className="block text-sm mb-1.5">GitHub username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="octocat" />
          </label>
          <button
            type="submit"
            disabled={busy || !username.trim()}
            className="flex items-center gap-2 bg-action text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-action/90 disabled:bg-hair dark:disabled:bg-white/10 disabled:text-muted dark:disabled:text-white/30 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {github ? "Refresh" : "Check GitHub"}
          </button>
        </form>

        {error && (
          <div role="alert" className="border border-fail/30 bg-fail/5 text-fail text-sm rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {github && (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div>
                <p className="font-medium leading-tight">{github.name ?? github.username}</p>
                <a href={github.profileUrl} target="_blank" rel="noreferrer" className="text-sm text-muted dark:text-white/50 font-mono hover:underline">
                  @{github.username} · fetched {timeAgo(github.fetchedAt)}
                </a>
              </div>
              <span className="inline-block font-mono text-xs px-2 py-0.5 rounded border border-pass/30 bg-pass/10 text-pass">FOUND</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 border border-hair dark:border-white/10 rounded-lg overflow-hidden mb-6">
              <Stat label="Public repos" value={String(github.publicRepos)} />
              <Stat label="Stars on own repos" value={String(github.totalStars)} border="border-l border-hair dark:border-white/10" />
              <Stat label="Followers" value={String(github.followers)} border="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-hair dark:border-white/10" />
            </div>

            <div className="border border-hair dark:border-white/10 rounded-lg p-5 mb-6">
              <p className="text-sm text-muted dark:text-white/50 mb-4">
                Public activity · last {github.activityDays} days · {Object.values(github.activity).reduce((a, b) => a + b, 0)} events
              </p>
              <Heatmap activity={github.activity} />
              <p className="text-xs text-muted dark:text-white/40 mt-3">GitHub only exposes about 90 days of public events without a login, so older activity is not shown.</p>
            </div>

            <div className="border border-hair dark:border-white/10 rounded-lg p-5 mb-10">
              <p className="font-medium mb-3">Resume skills vs public repos</p>
              {analysis.skills.length === 0 ? (
                <p className="text-sm text-muted dark:text-white/60">No recognised skills in the resume to compare.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {verified.map((s) => (
                    <span key={s} className="font-mono text-xs px-2 py-1 rounded border border-pass/30 bg-pass/10 text-pass">
                      ✓ {s} · {githubEvidence(github, s)} repos
                    </span>
                  ))}
                  {unverified.map((s) => (
                    <span key={s} className="font-mono text-xs px-2 py-1 rounded border border-hair dark:border-white/15 text-muted dark:text-white/50">
                      {s} · not seen
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted dark:text-white/40 mt-3">
                A skill counts as seen when a repo uses it as its main language or lists it as a topic. Skills used only in private repos will show as not seen.
              </p>
            </div>

            <h2 className="font-mono text-xs text-muted dark:text-white/50 uppercase mb-1">Top repositories</h2>
            <ul className="border-b border-hair dark:border-white/10 mb-12">
              {github.topRepos.length === 0 && <li className="py-4 text-sm text-muted dark:text-white/60">No public repositories yet.</li>}
              {github.topRepos.map((repo, i) => (
                <li key={repo.name} className="flex items-center justify-between gap-4 py-4 border-t first:border-t-0 border-hair dark:border-white/10">
                  <div className="min-w-0">
                    <a href={repo.url} target="_blank" rel="noreferrer" className="text-action dark:text-[#5C86FF] font-medium hover:underline">
                      {repo.name}
                    </a>
                    <p className="text-sm text-muted dark:text-white/50 truncate">{repo.description || "No description"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm text-muted dark:text-white/50">★ {repo.stars}</span>
                    {repo.language && (
                      <span className={`font-mono text-xs px-2 py-0.5 rounded min-w-[4.5rem] text-center ${langStyle[i % langStyle.length]}`}>{repo.language}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {!github && !busy && (
          <p className="text-sm text-muted dark:text-white/60 mb-10">
            Enter your GitHub username to compare the skills on your resume with your public repositories.
          </p>
        )}

        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="font-display font-bold text-xl">Certifications</h2>
          {!adding && (
            <button onClick={() => setAdding(true)} className="border border-hair dark:border-white/15 text-sm font-medium px-4 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 whitespace-nowrap">
              Add certificate
            </button>
          )}
        </div>
        {adding && <CertForm onDone={() => setAdding(false)} />}
        <ul className="border-b border-hair dark:border-white/10">
          {(certs ?? []).length === 0 && <li className="py-4 text-sm text-muted dark:text-white/60">No certificates added yet.</li>}
          {(certs ?? []).map((cert) => {
            const status = certStatus(cert);
            const style = certStyle[status];
            return (
              <li key={cert.id} className={`flex items-center justify-between gap-4 pl-5 pr-4 py-4 border-l-4 ${style.border} border-t first:border-t-0 border-t-hair dark:border-t-white/10`}>
                <div className="min-w-0">
                  <p className="font-medium">
                    {cert.url ? (
                      <a href={cert.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {cert.name}
                      </a>
                    ) : (
                      cert.name
                    )}
                  </p>
                  <p className="text-sm text-muted dark:text-white/50">
                    {[cert.issuer, cert.issued && `issued ${cert.issued}`, cert.expires && `expires ${cert.expires}`].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded border ${style.badge}`}>{style.label}</span>
                  <button onClick={() => removeCert(cert.id)} aria-label={`Remove ${cert.name}`} className="text-muted dark:text-white/40 hover:text-fail">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted dark:text-white/40 mt-3">
          Certificates are not verified with the issuer. ACTIVE means a credential link was given and the expiry date has not passed.
        </p>
      </div>
    </div>
  );
}
