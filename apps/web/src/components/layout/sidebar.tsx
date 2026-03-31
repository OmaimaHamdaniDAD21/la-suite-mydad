"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  Layers,
  CheckSquare,
  Target,
  BarChart3,
  Star,
  Users,
  BookOpen,
  Bot,
  Wrench,
  Link2,
  Briefcase,
  FileText,
} from "lucide-react";

const sections = [
  {
    label: "Pilotage",
    items: [
      { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
      { icon: Layers, label: "Parcours", href: "/parcours" },
      { icon: CheckSquare, label: "Plan d'Actions", href: "/actions" },
    ],
  },
  {
    label: "Performance",
    items: [
      { icon: Target, label: "Strategie", href: "/strategie" },
      { icon: BarChart3, label: "Indicateurs", href: "/indicateurs" },
      { icon: Star, label: "Opportunites", href: "/opportunites" },
    ],
  },
  {
    label: "Equipe & Formation",
    items: [
      { icon: Users, label: "Equipe", href: "/equipe" },
      { icon: BookOpen, label: "Formations", href: "/formations" },
    ],
  },
  {
    label: "IA & Outils",
    items: [
      { icon: Bot, label: "Studio IA", href: "/studio-ia" },
      { icon: Wrench, label: "Outils MyDAD", href: "/outils" },
      { icon: Link2, label: "Connecteurs API", href: "/connecteurs" },
    ],
  },
  {
    label: "Portefeuille",
    items: [
      { icon: Briefcase, label: "Mes Clients", href: "/clients" },
    ],
  },
  {
    label: "Documentation",
    items: [
      { icon: FileText, label: "Documents & Audit", href: "/documents" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] bg-surface border-r border-border flex flex-col flex-shrink-0 h-screen fixed left-0 top-0 z-[100] overflow-y-auto">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2.5 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-extrabold text-[10px]">MD</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-text">La Suite MyDAD</h1>
          <span className="text-[9px] text-text-muted block uppercase tracking-wider font-semibold">
            Plateforme de performance
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-0.5">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-3.5 pt-4 pb-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-2.5 py-[7px] rounded-[var(--radius-sm)] text-[13px] font-medium mb-[1px] select-none transition-all ${
                    isActive
                      ? "bg-primary text-white font-semibold"
                      : "text-text-secondary hover:bg-bg hover:text-text"
                  }`}
                >
                  <Icon
                    size={16}
                    className={`flex-shrink-0 ${isActive ? "opacity-100" : "opacity-60"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 px-3.5 border-t border-border flex items-center gap-2">
        <div className="w-[30px] h-[30px] bg-primary rounded-[var(--radius-sm)] flex items-center justify-center font-bold text-[10px] text-white">
          SL
        </div>
        <div>
          <div className="text-xs font-semibold">Sophie Laurent</div>
          <div className="text-[10px] text-text-muted">Expert-Comptable</div>
        </div>
      </div>
    </aside>
  );
}
