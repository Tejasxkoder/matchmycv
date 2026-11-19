import { countChecks, type Check } from "@/lib/analysis-types";

export function RunSummaryBar({ checks }: { checks: Check[] }) {
  const { pass, warn, fail, pending } = countChecks(checks);
  const ran = pass + warn + fail;
  const share = (n: number) => (ran === 0 ? 0 : (n / ran) * 100);

  return (
    <div className="bg-[#0d1016] rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm shrink-0">
        <span className="text-pass">{pass} passed</span>
        <span className="text-white/20">·</span>
        <span className="text-warn">{warn} warned</span>
        <span className="text-white/20">·</span>
        <span className="text-fail">{fail} failed</span>
        {pending > 0 && (
          <>
            <span className="text-white/20">·</span>
            <span className="text-white/40">{pending} pending</span>
          </>
        )}
      </div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-white/10">
        <div className="bg-pass" style={{ width: `${share(pass)}%` }} />
        <div className="bg-warn" style={{ width: `${share(warn)}%` }} />
        <div className="bg-fail" style={{ width: `${share(fail)}%` }} />
      </div>
    </div>
  );
}
