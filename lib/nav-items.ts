import {
  LayoutDashboard,
  FileText,
  Target,
  TrendingUp,
  GitBranch,
  ShieldCheck,
  MessageSquare,
  History,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume Analysis", href: "/resume-analysis", icon: FileText },
  { label: "JD Match", href: "/jd-match", icon: Target },
  { label: "Job Market", href: "/job-market", icon: TrendingUp },
  { label: "Skill Gap", href: "/skill-roadmap", icon: GitBranch },
  { label: "Credibility", href: "/credibility", icon: ShieldCheck },
  { label: "Interview Prep", href: "/interview-prep", icon: MessageSquare },
  { label: "Versions", href: "/versions", icon: History },
];

export const profileNavItem: NavItem = {
  label: "Profile & Settings",
  href: "/profile",
  icon: User,
};
