import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./brand-mark";

export function Navbar() {
  return (
    <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5 border-b border-hair dark:border-white/10">
      <div className="flex items-center gap-2">
        <BrandMark />
        <span className="font-display font-bold text-lg">MatchMyCV</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <a
          href="#how-it-works"
          className="hidden sm:inline text-sm text-muted dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors"
        >
          How it works
        </a>
        <ThemeToggle />
        <Link
          href="/upload"
          className="bg-action text-white text-sm font-medium px-3 py-2 sm:px-4 rounded-md hover:bg-action/90 transition-colors whitespace-nowrap"
        >
          Analyze your resume
        </Link>
      </div>
    </nav>
  );
}
