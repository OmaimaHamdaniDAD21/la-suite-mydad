"use client";

import { Button } from "@/components/ui/button";
import { Users, Folder, BarChart3, Briefcase, Shield, Heart, Zap, Activity, DollarSign } from "lucide-react";

const tools = [
  { name: "Consultation citoyenne", desc: "Impliquez vos parties prenantes", icon: Users, level: "Niv. 1", levelColor: "green", locked: false },
  { name: "Files", desc: "Echange de documents securise", icon: Folder, level: "Niv. 1", levelColor: "green", locked: false },
  { name: "Extra-financiere", desc: "Performance extra-financiere", icon: BarChart3, level: "Niv. 1", levelColor: "green", locked: false },
  { name: "Easy-fi", desc: "Dossiers bancaires et financements", icon: Briefcase, level: "Niv. 2", levelColor: "blue", locked: false },
  { name: "Impact4good", desc: "Mesurez votre impact positif", icon: Shield, level: "Niv. 3", levelColor: "gray", locked: true },
  { name: "IBET", desc: "Bien-etre au travail", icon: Heart, level: "Niv. 3", levelColor: "gray", locked: true },
  { name: "Wellpass Moove", desc: "Sport et bien-etre", icon: Zap, level: "Niv. 3", levelColor: "gray", locked: true },
  { name: "Scoring", desc: "Benchmark sectoriel", icon: Activity, level: "Niv. 4", levelColor: "gray", locked: true },
  { name: "Solvabilite", desc: "Analyse avancee", icon: DollarSign, level: "Niv. 4", levelColor: "gray", locked: true },
];

const levelBg: Record<string, string> = {
  green: "bg-green-bg text-green",
  blue: "bg-primary-bg text-primary",
  gray: "bg-bg text-text-muted",
};

export default function OutilsPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Mes Outils</div>
          <div className="text-xs text-text-secondary mt-0.5">Niveau actuel : 2 &mdash; 4 outils debloques</div>
        </div>
        <Button>Voir les prerequis</Button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.name}
              className={`bg-surface border border-border rounded-[var(--radius)] p-3.5 shadow relative transition-all ${
                tool.locked ? "opacity-35" : "hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              <div className={`absolute top-2 right-2 text-[9px] font-semibold px-[5px] py-[2px] rounded ${levelBg[tool.levelColor]}`}>
                {tool.level}
              </div>
              <div className="text-xl mb-2 flex items-center h-6">
                <Icon size={22} className={tool.locked ? "text-text-muted" : "text-text"} strokeWidth={1.8} />
              </div>
              <div className="text-[13px] font-semibold mb-0.5">{tool.name}</div>
              <div className="text-[11px] text-text-secondary mb-2.5 leading-snug">{tool.desc}</div>
              <button
                className={`w-full py-1.5 rounded-[var(--radius-sm)] border text-[11px] font-semibold cursor-pointer ${
                  tool.locked
                    ? "text-text-muted border-border cursor-not-allowed bg-surface"
                    : "bg-primary text-white border-primary"
                }`}
                disabled={tool.locked}
              >
                {tool.locked ? `${tool.level} requis` : "Acceder"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
