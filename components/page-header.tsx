import Link from "next/link";

export function PageHeader({
  title,
  crumb,
  actions,
}: {
  title: string;
  crumb: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="px-5 sm:px-10 pt-7 pb-6 border-b border-hair dark:border-white/10 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm text-muted dark:text-white/50 mb-1">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          <span className="mx-1">/</span> <span className="text-ink dark:text-white">{crumb}</span>
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-3 pt-2">{actions}</div>}
    </div>
  );
}
