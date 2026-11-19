import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MatchMyCV — Your resume is a codebase",
  description:
    "Upload your resume and get a full CI/CD-style pipeline run: ATS checks, quantification flags, bias detection, JD match scoring, and a dependency graph of your skill gaps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('matchmycv-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-paper dark:bg-[#0B0D11] text-ink dark:text-[#F5F4F0] antialiased transition-colors duration-300`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
