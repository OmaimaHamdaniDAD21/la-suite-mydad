"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const stats = [
  { val: "12", label: "Clients actifs" },
  { val: "2.4", label: "Niveau moyen" },
  { val: "187 K\u20AC", label: "Valeur creee", color: "var(--green)" },
  { val: "47", label: "Actions en cours" },
];

const clients = [
  { initials: "BM", name: "Boulangerie Martin", sector: "Artisanat", emp: 8, level: 2, levelColor: "var(--hosmony-2)", score: 47, ca: "847K\u20AC", caGrowth: "+8.2%", caColor: "var(--green)", marge: "12.4%", actions: "5/12", actionsPct: 42, actionsColor: "var(--primary)", value: "23.4K\u20AC" },
  { initials: "GT", name: "Garage Thibault", sector: "Auto", emp: 15, level: 3, levelColor: "var(--hosmony-3)", score: 58, ca: "2.1M\u20AC", caGrowth: "+5.1%", caColor: "var(--green)", marge: "8.7%", actions: "9/14", actionsPct: 64, actionsColor: "var(--green)", value: "41.2K\u20AC" },
  { initials: "PR", name: "Pharmacie Rousseau", sector: "Sante", emp: 6, level: 1, levelColor: "var(--hosmony-1)", score: 18, ca: "1.4M\u20AC", caGrowth: "+2.3%", caColor: "var(--green)", marge: "6.2%", actions: "2/8", actionsPct: 25, actionsColor: "var(--amber)", value: "5.4K\u20AC" },
  { initials: "CD", name: "Cabinet Dupont", sector: "Architecture", emp: 22, level: 2, levelColor: "var(--hosmony-2)", score: 35, ca: "3.8M\u20AC", caGrowth: "+12%", caColor: "var(--green)", marge: "14.1%", actions: "4/10", actionsPct: 40, actionsColor: "var(--primary)", value: "18.7K\u20AC" },
  { initials: "VB", name: "Vignobles Beaumont", sector: "Viticulture", emp: 35, level: 3, levelColor: "var(--hosmony-3)", score: 62, ca: "5.2M\u20AC", caGrowth: "+7.8%", caColor: "var(--green)", marge: "18.3%", actions: "11/16", actionsPct: 69, actionsColor: "var(--green)", value: "67.3K\u20AC" },
  { initials: "RL", name: "Restaurant Le Lys", sector: "Restauration", emp: 12, level: 1, levelColor: "var(--hosmony-1)", score: 22, ca: "890K\u20AC", caGrowth: "\u22121.2%", caColor: "var(--red)", marge: "4.8%", actions: "1/6", actionsPct: 17, actionsColor: "var(--red)", value: "3.1K\u20AC" },
];

export default function ClientsPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Portefeuille Clients</div>
          <div className="text-xs text-text-secondary mt-0.5">Supervision expert-comptable</div>
        </div>
        <div className="flex gap-1.5">
          <Button>Exporter</Button>
          <Button variant="primary">+ Ajouter un client</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-[var(--radius)] p-3.5 shadow text-center hover:-translate-y-[1px] transition-transform" style={{ borderLeft: `3px solid ${["var(--primary)", "var(--green)", "var(--amber)", "var(--purple)"][i]}` }}>
            <div className="text-xl font-extrabold" style={{ color: s.color || "var(--text)" }}>{s.val}</div>
            <div className="text-[11px] text-text-secondary mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search/Filter */}
      <div className="mb-3 flex gap-1.5">
        <input className="flex-1 px-3 py-[7px] border border-border rounded-[var(--radius-sm)] text-xs" placeholder="Rechercher un client..." />
        <select className="px-2 py-1.5 border border-border rounded-[var(--radius-sm)] text-[11px]">
          <option>Tous niveaux</option>
          <option>Niv. 1</option>
          <option>Niv. 2</option>
          <option>Niv. 3</option>
        </select>
        <select className="px-2 py-1.5 border border-border rounded-[var(--radius-sm)] text-[11px]">
          <option>Tous secteurs</option>
          <option>Artisanat</option>
          <option>Auto</option>
          <option>Sante</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {["Client", "Niveau", "CA", "Marge", "Actions", "Valeur creee", ""].map((col) => (
                <th key={col} className="text-left px-2.5 py-[7px] text-[10px] font-semibold uppercase tracking-wide text-text-muted bg-bg border-b border-border">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.initials} className="hover:bg-surface-hover">
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[6px] flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0" style={{ background: c.levelColor }}>{c.initials}</div>
                    <div>
                      <strong>{c.name}</strong>
                      <div className="text-[11px] text-text-muted">{c.sector} &bull; {c.emp} emp.</div>
                    </div>
                  </div>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <div className="flex items-center gap-[5px]">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold text-white" style={{ background: c.levelColor }}>{c.level}</div>
                    <span className="text-[11px]">{c.score}/100</span>
                  </div>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <strong>{c.ca}</strong>
                  <div className="text-[11px]" style={{ color: c.caColor }}>{c.caGrowth}</div>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border-light"><strong>{c.marge}</strong></td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <span className="text-[11px]">{c.actions}</span>
                  <div className="w-[60px] h-[3px] mt-[3px] bg-border-light rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.actionsPct}%`, background: c.actionsColor }} />
                  </div>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <strong className="text-green">{c.value}</strong>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <Button size="sm" variant="primary">Dossier</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
