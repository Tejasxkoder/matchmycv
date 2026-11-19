const LEVELS = [
  "bg-black/[0.07] dark:bg-white/[0.07]",
  "bg-action/25",
  "bg-action/50",
  "bg-action/75",
  "bg-action",
];

export function levelFor(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

export function buildDays(weeks: number, now: Date = new Date()): string[] {
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - today.getUTCDay() - (weeks - 1) * 7);
  const days: string[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function Heatmap({ activity, weeks = 13 }: { activity: Record<string, number>; weeks?: number }) {
  const days = buildDays(weeks);
  const todayKey = new Date().toISOString().slice(0, 10);
  const max = Math.max(...Object.values(activity), 0);
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-[3px] w-max" role="img" aria-label={`Contribution heatmap for the past ${weeks} weeks`}>
          {days.map((day) => {
            const count = day > todayKey ? 0 : activity[day] ?? 0;
            return (
              <span
                key={day}
                title={`${day}: ${count}`}
                className={`w-3 h-3 rounded-[2px] ${day > todayKey ? "opacity-0" : LEVELS[levelFor(count, max)]}`}
              />
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-muted dark:text-white/40">
        Less
        {LEVELS.map((cls) => (
          <span key={cls} className={`w-3 h-3 rounded-[2px] ${cls}`} />
        ))}
        More
      </div>
    </div>
  );
}
