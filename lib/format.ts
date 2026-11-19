export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function shortTimeAgo(iso: string, now: number = Date.now()): string {
  const full = timeAgo(iso, now);
  if (full === "just now" || full === "unknown") return full;
  const [amount, unit] = full.split(" ");
  return `${amount}${unit[0]} ago`;
}
