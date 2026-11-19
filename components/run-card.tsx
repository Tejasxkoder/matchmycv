import { StatusRow } from "./status-row";

const checks = [
  { label: "ATS Compatibility", time: "2.1s", status: "pass" as const },
  { label: "Quantification", time: "1.8s", status: "warn" as const },
  { label: "Keyword Density", time: "3.2s", status: "fail" as const },
  { label: "Format Compliance", time: "0.9s", status: "pass" as const },
  { label: "GitHub Signals", time: "4.1s", status: "pass" as const },
  { label: "JD Match · Senior SWE", time: "2.7s", status: "warn" as const },
];

export function RunCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-xl">
      <div className="bg-ink px-4 py-3 flex items-center gap-4">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-fail/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-warn/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-pass/80" />
        </div>
        <span className="font-mono text-xs text-white/50">matchmycv · run #47</span>
      </div>

      <div className="bg-[#0d1016] px-4 py-4 font-mono text-sm">
        <p className="text-white/40 mb-3">
          ▶ resumé_v3.pdf · main · triggered 2m ago
        </p>

        <div className="space-y-2.5">
          {checks.map((check) => (
            <StatusRow key={check.label} {...check} />
          ))}
        </div>

        <div className="border-t border-white/10 mt-4 pt-3 flex justify-between text-xs">
          <span>
            <span className="text-pass">3 passed</span>{" "}
            <span className="text-warn ml-2">2 warned</span>{" "}
            <span className="text-fail ml-2">1 failed</span>
          </span>
          <span className="text-white/30">14.8s total</span>
        </div>
      </div>
    </div>
  );
}
