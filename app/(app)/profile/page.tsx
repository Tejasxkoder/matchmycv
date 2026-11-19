"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { clearAnalysis } from "@/lib/analysis-store";
import { clearCerts } from "@/lib/certs-store";
import { clearGithub } from "@/lib/github-store";
import { clearInterview } from "@/lib/interview-store";
import { clearJd } from "@/lib/jd-store";
import { DEFAULT_PROFILE, initials, resetProfile, saveProfile, useProfile, type Profile } from "@/lib/profile-store";
import { clearVersions } from "@/lib/versions-store";

const inputClass =
  "w-full bg-transparent border border-hair dark:border-white/15 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-action";
const sectionTitle = "font-display font-bold text-lg pb-4 border-b border-hair dark:border-white/10 mb-6";

type BoolKey = "notifyAts" | "notifyJobs" | "notifyDigest" | "biasFlags";

function Field({ label, value, onChange, span, placeholder }: { label: string; value: string; onChange: (v: string) => void; span?: boolean; placeholder?: string }) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="block text-sm mb-2">{label}</span>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

function Toggle({ label, description, on, onChange }: { label: string; description: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b border-hair dark:border-white/10">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted dark:text-white/60 mt-1">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${on ? "bg-action" : "bg-black/15 dark:bg-white/20"}`}
      >
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: on ? "translateX(20px)" : "none" }} />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const stored = useProfile();
  const [form, setForm] = useState<Profile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      setForm(stored);
    }
  }, [stored]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const text = (key: keyof Profile) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const flag = (key: BoolKey) => (value: boolean) => setForm((f) => ({ ...f, [key]: value }));

  function save() {
    saveProfile({ ...form, github: form.github.replace(/^@/, "").trim() });
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 1800);
  }

  function deleteData() {
    if (!window.confirm("Delete every saved analysis, version, job description and interview set on this device?")) return;
    clearAnalysis();
    clearVersions();
    clearJd();
    clearGithub();
    clearInterview();
    clearCerts();
    setNotice("All resume data on this device was deleted.");
  }

  function resetAll() {
    if (!window.confirm("Reset your profile and settings to the defaults?")) return;
    resetProfile();
    setForm(DEFAULT_PROFILE);
    setNotice("Profile and settings were reset.");
  }

  return (
    <div>
      <PageHeader
        title="Profile & Settings"
        crumb="Settings"
        actions={
          <button type="button" onClick={save} className="bg-action text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-action/90">
            {saved ? "Saved ✓" : "Save changes"}
          </button>
        }
      />
      <div className="px-5 sm:px-10 py-10 grid lg:grid-cols-[3fr_2fr] gap-x-16 gap-y-12 max-w-6xl">
        <div>
          {notice && (
            <div role="status" className="border border-hair dark:border-white/15 text-sm rounded-lg px-4 py-3 mb-6">
              {notice}
            </div>
          )}
          <h2 className={sectionTitle}>Profile</h2>
          <div className="flex items-center gap-5 mb-8">
            <span className="w-[70px] h-[70px] rounded-full bg-action text-white text-2xl font-bold flex items-center justify-center">{initials(form.fullName)}</span>
            <p className="text-sm text-muted dark:text-white/50">Your details are stored in this browser only.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 mb-12">
            <Field label="Full name" value={form.fullName} onChange={text("fullName")} />
            <Field label="Email" value={form.email} onChange={text("email")} />
            <Field label="GitHub username" value={form.github} onChange={text("github")} />
            <Field label="LinkedIn handle" value={form.linkedin} onChange={text("linkedin")} />
          </div>

          <h2 className={sectionTitle}>Job search preferences</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Target role title" value={form.targetRole} onChange={text("targetRole")} placeholder="Used for the Job Market page" />
            <label className="block">
              <span className="block text-sm mb-2">Level</span>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className={`${inputClass} dark:[color-scheme:dark]`}
              >
                {["L3", "L4", "L5", "L6", "L7"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <Field label="Target salary (USD/year)" value={form.salary} onChange={text("salary")} span />
            <Field label="Preferred location" value={form.locations} onChange={text("locations")} span placeholder="One city, used to filter Job Market listings" />
          </div>
        </div>

        <div>
          <h2 className={sectionTitle}>Notifications</h2>
          <div className="mb-12 -mt-6">
            <Toggle label="ATS check failures" description="Alert me when a new run finds blocking issues" on={form.notifyAts} onChange={flag("notifyAts")} />
            <Toggle label="New job matches" description="Daily digest of roles above 70% match score" on={form.notifyJobs} onChange={flag("notifyJobs")} />
            <Toggle label="Weekly market digest" description="Salary trends and demand shifts" on={form.notifyDigest} onChange={flag("notifyDigest")} />
            <p className="text-xs text-muted dark:text-white/40 mt-3">Alerts need an account and email delivery, which this version does not have yet. Choices are saved for when it does.</p>
          </div>

          <h2 className={sectionTitle}>Analysis preferences</h2>
          <div className="mb-12 -mt-6">
            <Toggle label="Bias and tone flags" description="Show the Bias & Tone check on the dashboard" on={form.biasFlags} onChange={flag("biasFlags")} />
          </div>

          <h2 className={`${sectionTitle} text-fail`}>Danger zone</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="font-medium">Delete all resume data</p>
                <p className="text-sm text-muted dark:text-white/60 mt-1">Removes every analysis, version and saved result on this device</p>
              </div>
              <button type="button" onClick={deleteData} className="border border-fail/60 text-fail text-sm font-medium px-4 py-2 rounded-md hover:bg-fail/10 shrink-0">
                Delete data
              </button>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="font-medium">Reset profile and settings</p>
                <p className="text-sm text-muted dark:text-white/60 mt-1">There is no account yet, so this clears what is saved here</p>
              </div>
              <button type="button" onClick={resetAll} className="border border-fail/60 text-fail text-sm font-medium px-4 py-2 rounded-md hover:bg-fail/10 shrink-0">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
