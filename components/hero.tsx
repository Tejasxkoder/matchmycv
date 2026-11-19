import Link from "next/link";
import { RunCard } from "./run-card";

export function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 md:py-16 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
      <div>
        <div className="inline-flex items-center gap-2 border border-hair dark:border-white/15 rounded-full px-3 py-1 text-xs text-muted dark:text-white/50 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-pass" aria-hidden="true" />
          v1.0 · now in beta
        </div>

        <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.05] mb-6">
          Your resume is a codebase.
          <br />
          <span className="text-action dark:text-[#5C86FF]">MatchMyCV runs the checks.</span>
        </h1>

        <p className="text-muted dark:text-white/60 text-lg leading-relaxed mb-8 max-w-md">
          Upload your resume. Get a full CI/CD pipeline run — ATS checks,
          quantification flags, bias detection, JD match scoring, and a
          dependency graph of your skill gaps.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/upload"
            className="bg-action text-white font-medium px-5 py-3 rounded-md hover:bg-action/90 transition-colors"
          >
            Run your first analysis
          </Link>
          <span className="text-sm text-muted dark:text-white/50">Free. No account required.</span>
        </div>
      </div>

      <RunCard />
    </section>
  );
}
