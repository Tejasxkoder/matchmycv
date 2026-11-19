import { Check, TriangleAlert, X } from "lucide-react";

type Status = "pass" | "warn" | "fail";

const statusConfig: Record<
  Status,
  { icon: typeof Check; color: string; label: string }
> = {
  pass: { icon: Check, color: "text-pass", label: "PASS" },
  warn: { icon: TriangleAlert, color: "text-warn", label: "WARN" },
  fail: { icon: X, color: "text-fail", label: "FAIL" },
};

export function StatusRow({
  label,
  time,
  status,
}: {
  label: string;
  time: string;
  status: Status;
}) {
  const { icon: Icon, color, label: statusLabel } = statusConfig[status];

  return (
    <div className="flex items-center justify-between text-white/90">
      <span className="flex items-center gap-2">
        <Icon size={14} className={color} aria-hidden="true" />
        {label}
      </span>
      <span className="text-white/30 text-xs flex items-center gap-2">
        {time}
        <span className={color}>{statusLabel}</span>
      </span>
    </div>
  );
}
