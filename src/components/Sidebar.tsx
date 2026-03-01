"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone, Users, Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/match", label: "Match", icon: Zap },
  { href: "/brief", label: "Brief", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="panel m-3 mb-0 flex h-[calc(100vh-12px)] flex-col overflow-hidden md:m-3">
      <div className="border-b border-[var(--line-soft)] px-4 py-4">
        <p className="text-lg font-black tracking-tight">wayv</p>
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">creator matching</p>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--brand-soft)] text-[var(--text)]"
                  : "text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
