"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◧" },
  { href: "/macro", label: "Macro & Market", icon: "◎" },
  { href: "/research", label: "Research", icon: "◇" },
  { href: "/company", label: "Company Analysis", icon: "▤" },
  { href: "/valuation", label: "Valuation", icon: "▦" },
  { href: "/thesis", label: "Thesis & AI Challenge", icon: "◈" },
  { href: "/positions", label: "Positions", icon: "▸" },
  { href: "/review", label: "Revue rapide", icon: "◉" },
  { href: "/journal", label: "Journal & Learning", icon: "▪" },
];

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="sidebar">
      <div className="brand">
        US Equity OS
        <small>Don&apos;t automate my thinking</small>
      </div>
      <div className="navsep">Workflow</div>
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className="navlink" data-active={isActive(n.href)}>
          <span aria-hidden style={{ width: 14, textAlign: "center", opacity: 0.7 }}>{n.icon}</span>
          {n.label}
        </Link>
      ))}
      <div className="navsep">Système</div>
      <Link href="/settings" className="navlink" data-active={isActive("/settings")}>
        <span aria-hidden style={{ width: 14, textAlign: "center", opacity: 0.7 }}>⚙</span>
        Réglages
      </Link>
    </nav>
  );
}
