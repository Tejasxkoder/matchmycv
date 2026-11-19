"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

type TransitionDocument = {
  startViewTransition?: (callback: () => void) => { ready: Promise<unknown> };
};

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("matchmycv-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    const button = buttonRef.current;

    const applyTheme = () => {
      setIsDark(next);
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("matchmycv-theme", next ? "dark" : "light");
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const doc = document as unknown as TransitionDocument;

    if (!button || !doc.startViewTransition || reducedMotion) {
      applyTheme();
      return;
    }

    const { left, top, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(applyTheme);

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="w-9 h-9 rounded-full border border-hair dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
