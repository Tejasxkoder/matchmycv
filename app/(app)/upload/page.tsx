"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Loader2 } from "lucide-react";
import { saveAnalysis } from "@/lib/analysis-store";
import type { AnalysisResult } from "@/lib/analysis-types";
import { buildSampleAnalysis } from "@/lib/sample-analysis";

const MAX_BYTES = 4 * 1024 * 1024;
const MIN_CHARS = 200;
const ALLOWED = ["pdf", "docx", "txt"];
const steps = ["Reading your resume", "Running the checks", "Asking the AI for rewrite suggestions"];

export default function UploadPage() {
  const [mode, setMode] = useState<"file" | "text">("file");
  const [dragOver, setDragOver] = useState(false);
  const [working, setWorking] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!working) return;
    setStep(0);
    const timers = [setTimeout(() => setStep(1), 1500), setTimeout(() => setStep(2), 4000)];
    return () => timers.forEach(clearTimeout);
  }, [working]);

  async function send(body: FormData) {
    setError(null);
    setWorking(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Please try again.");
      saveAnalysis(json.analysis as AnalysisResult);
      router.push("/dashboard");
    } catch (err) {
      const offline = err instanceof TypeError;
      setError(offline ? "Could not reach the server. Check your connection and try again." : (err as Error).message);
      setWorking(false);
    }
  }

  function sendFile(file: File | undefined) {
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    if (!ALLOWED.includes(ext)) {
      setError("Upload a PDF, DOCX or TXT file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is over 4 MB. Try a smaller export or paste the text instead.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    send(body);
  }

  function sendText() {
    const body = new FormData();
    body.set("text", text);
    send(body);
  }

  function useSample() {
    saveAnalysis(buildSampleAnalysis());
    router.push("/dashboard");
  }

  const tabClass = (active: boolean, first: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${first ? "" : "border-l border-hair dark:border-white/15"} ${
      active
        ? "bg-ink dark:bg-white text-white dark:text-ink"
        : "text-muted dark:text-white/60 hover:text-ink dark:hover:text-white"
    }`;

  return (
    <div className="px-5 sm:px-10 py-8 sm:py-10 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2">Upload your resume</h1>
      <p className="text-muted dark:text-white/60 mb-8">
        MatchMyCV parses structure, runs 8 checks, and builds your dashboard in under 30 seconds.
      </p>

      <div className="inline-flex border border-hair dark:border-white/15 rounded-md overflow-hidden mb-6">
        <button disabled={working} onClick={() => setMode("file")} className={tabClass(mode === "file", true)}>
          Upload PDF
        </button>
        <button disabled={working} onClick={() => setMode("text")} className={tabClass(mode === "text", false)}>
          Describe your experience
        </button>
      </div>

      {error && (
        <div role="alert" className="border border-fail/30 bg-fail/5 text-fail text-sm rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {working ? (
        <div className="border border-dashed border-hair dark:border-white/15 rounded-lg py-14 px-6 flex flex-col items-center">
          <Loader2 size={28} className="animate-spin text-action dark:text-[#5C86FF] mb-5" aria-hidden="true" />
          <ul className="space-y-2 text-sm">
            {steps.map((label, i) => (
              <li
                key={label}
                className={`flex items-center gap-2 ${i <= step ? "text-ink dark:text-white" : "text-muted dark:text-white/30"}`}
              >
                {i < step ? (
                  <Check size={14} className="text-pass" aria-hidden="true" />
                ) : (
                  <span className="w-3.5 text-center" aria-hidden="true">
                    {i === step ? "•" : ""}
                  </span>
                )}
                {label}
              </li>
            ))}
          </ul>
        </div>
      ) : mode === "file" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            sendFile(e.dataTransfer.files[0]);
          }}
          className={`border border-dashed rounded-lg py-16 flex flex-col items-center text-center transition-colors ${
            dragOver ? "border-action bg-action/5" : "border-hair dark:border-white/15"
          }`}
        >
          <FileText size={32} className="text-muted dark:text-white/40 mb-4" aria-hidden="true" />
          <p className="font-display font-bold text-lg mb-1">Drop your resume here</p>
          <p className="text-sm text-muted dark:text-white/50 mb-6">PDF, DOCX or TXT, up to 4 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              sendFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 transition-colors"
          >
            Choose file
          </button>
        </div>
      ) : (
        <div className="border border-hair dark:border-white/15 rounded-lg p-6">
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your experience in plain language. Example: I spent 4 years as a backend engineer at a Series B fintech startup, building payment APIs in Go. Led a team of 3, shipped a real-time fraud detection system that cut chargebacks by 60%."
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted dark:placeholder:text-white/30 resize-none"
          />
          <div className="flex items-center justify-between gap-4 mt-4">
            <span className="text-xs text-muted dark:text-white/40">
              {text.trim().length < MIN_CHARS ? `${text.trim().length} / ${MIN_CHARS} characters` : "Ready"}
            </span>
            <button
              onClick={sendText}
              disabled={text.trim().length < MIN_CHARS}
              className="bg-action text-white font-medium px-5 py-2.5 rounded-md hover:bg-action/90 transition-colors disabled:bg-hair dark:disabled:bg-white/10 disabled:text-muted dark:disabled:text-white/30 disabled:cursor-not-allowed"
            >
              Parse my experience
            </button>
          </div>
        </div>
      )}

      {!working && (
        <p className="text-sm text-muted dark:text-white/50 mt-6">
          No resume handy?{" "}
          <button onClick={useSample} className="text-action dark:text-[#5C86FF] hover:underline">
            Open a sample run
          </button>
        </p>
      )}
    </div>
  );
}
