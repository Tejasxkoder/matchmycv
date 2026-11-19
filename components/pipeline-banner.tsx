import { ArrowRight } from "lucide-react";

const stages = [
  { label: "Parse resume", dot: "bg-pass" },
  { label: "ATS check", dot: "bg-warn" },
  { label: "Keyword density", dot: "bg-pass" },
  { label: "Quantification", dot: "bg-fail" },
  { label: "Bias & tone", dot: "bg-warn" },
  { label: "GitHub signals", dot: "bg-pass" },
  { label: "JD match", dot: "bg-warn" },
];

function Row() {
  return (
    <div className="flex items-center shrink-0">
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center">
          <span className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-hair dark:border-white/15 bg-paper dark:bg-[#0B0D11] whitespace-nowrap">
            <span className="font-mono text-xs w-5 h-5 rounded-full bg-action text-white flex items-center justify-center">{i + 1}</span>
            <span className="text-sm font-medium">{stage.label}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} aria-hidden="true" />
          </span>
          <ArrowRight size={18} className="mx-3 text-muted/60 dark:text-white/30 shrink-0" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

export function PipelineBanner() {
  const mask = "linear-gradient(to right,transparent,black 8%,black 92%,transparent)";
  return (
    <section className="border-y border-hair dark:border-white/10 py-5 overflow-hidden" aria-label="Pipeline stages, steps 1 to 7">
      <div style={{ WebkitMaskImage: mask, maskImage: mask }}>
        <div className="pipeline-track flex w-max items-center">
          <Row />
          <Row />
        </div>
      </div>
    </section>
  );
}
