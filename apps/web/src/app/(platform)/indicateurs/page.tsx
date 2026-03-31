"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { val: "32", label: "Indicateurs suivis", color: "var(--text)" },
  { val: "22", label: "Conformes", color: "var(--green)" },
  { val: "7", label: "En progres", color: "var(--amber)" },
  { val: "3", label: "Non conformes", color: "var(--red)" },
];

interface Indicator {
  name: string;
  value: string;
  target: string;
  trend?: string;
  trendColor?: string;
  source: string;
  status: "green" | "amber" | "red";
  statusLabel: string;
  next?: string;
}

const categories: { name: string; count: number; cols: string[]; indicators: Indicator[] }[] = [
  {
    name: "Environnement",
    count: 8,
    cols: ["Indicateur", "Valeur", "Objectif", "Tendance", "Source", "Statut", "Prochaine", ""],
    indicators: [
      { name: "Emissions CO2 (Scope 1+2)", value: "18.2 tCO2e", target: "\u2264 16.5", trend: "\u2193 \u221212%", trendColor: "var(--green)", source: "Calcul auto", status: "green", statusLabel: "OK", next: "Juin 26" },
      { name: "Consommation energetique", value: "42 500 kWh", target: "\u2264 40 000", trend: "\u2193 \u22128%", trendColor: "var(--green)", source: "Compteurs", status: "amber", statusLabel: "Progres", next: "Juin 26" },
      { name: "Dechets alimentaires", value: "3.2%", target: "\u2264 2%", trend: "\u2193 \u221235%", trendColor: "var(--green)", source: "Saisie", status: "amber", statusLabel: "Progres", next: "Juin 26" },
      { name: "Fournisseurs locaux", value: "72%", target: "\u2265 80%", trend: "\u2191 +5pts", trendColor: "var(--green)", source: "Pennylane", status: "amber", statusLabel: "Progres", next: "Juin 26" },
    ],
  },
  {
    name: "Social",
    count: 6,
    cols: ["Indicateur", "Valeur", "Objectif", "Tendance", "Source", "Statut", "Prochaine", ""],
    indicators: [
      { name: "Heures formation / employe", value: "14h", target: "\u2265 20h", trend: "\u2191 +4h", trendColor: "var(--green)", source: "PayFit", status: "red", statusLabel: "Non conf.", next: "Juin 26" },
      { name: "Satisfaction equipe", value: "7.1/10", target: "\u2265 7.5", trend: "=", source: "Enquete", status: "amber", statusLabel: "Progres", next: "Juin 26" },
      { name: "Turnover", value: "7.2%", target: "< 10%", trend: "\u2193", trendColor: "var(--green)", source: "PayFit", status: "green", statusLabel: "OK", next: "Juin 26" },
      { name: "Parite H/F encadrement", value: "40% F", target: "\u2265 40%", trend: "\u2191", source: "PayFit", status: "green", statusLabel: "OK", next: "Juin 26" },
    ],
  },
  {
    name: "Societale & Ethique",
    count: 5,
    cols: ["Indicateur", "Valeur", "Objectif", "Source", "Statut", ""],
    indicators: [
      { name: "NPS clients", value: "+42", target: "\u2265 +50", source: "Enquete", status: "amber", statusLabel: "Progres" },
      { name: "Actions solidaires / an", value: "3", target: "\u2265 4", source: "Saisie", status: "amber", statusLabel: "Progres" },
      { name: "Charte ethique", value: "Oui", target: "En place", source: "Document", status: "green", statusLabel: "OK" },
    ],
  },
  {
    name: "Gouvernance",
    count: 4,
    cols: ["Indicateur", "Valeur", "Objectif", "Source", "Statut", ""],
    indicators: [
      { name: "Reunions comite RSE", value: "2/an", target: "\u2265 4", source: "PV", status: "red", statusLabel: "Non conf." },
      { name: "Conformite RGPD", value: "85%", target: "100%", source: "Audit", status: "amber", statusLabel: "Progres" },
    ],
  },
];

export default function IndicateursPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Indicateurs RSE</div>
          <div className="text-xs text-text-secondary mt-0.5">Frequence : Semestrielle (Niveau 2)</div>
        </div>
        <div className="flex gap-1.5">
          <Button>Importer des donnees</Button>
          <Button>Exporter</Button>
          <Button variant="primary">+ Ajouter un indicateur</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 items-center mb-3 px-3 py-2 bg-surface border border-border rounded-[var(--radius)] text-xs">
        <span className="font-semibold">Filtrer :</span>
        <select className="px-1.5 py-1 border border-border rounded-[var(--radius-sm)] text-[11px] bg-surface">
          <option>Toutes categories</option>
          <option>Environnement</option>
          <option>Social</option>
          <option>Societale</option>
          <option>Ethique</option>
          <option>Gouvernance</option>
        </select>
        <select className="px-1.5 py-1 border border-border rounded-[var(--radius-sm)] text-[11px] bg-surface">
          <option>Tous statuts</option>
          <option>Conforme</option>
          <option>En progres</option>
          <option>Non conforme</option>
        </select>
        <select className="px-1.5 py-1 border border-border rounded-[var(--radius-sm)] text-[11px] bg-surface">
          <option>Toutes sources</option>
          <option>Saisie manuelle</option>
          <option>Pennylane</option>
          <option>PayFit</option>
          <option>Calcul auto</option>
        </select>
        <div className="flex-1" />
        <Badge color="blue">Niv.2 Semestriel</Badge>
        <Badge color="gray">Niv.3 Trim.</Badge>
        <Badge color="gray">Niv.4 Mens.</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-[var(--radius)] p-3.5 shadow text-center hover:-translate-y-[1px] transition-transform" style={{ borderLeft: `3px solid ${["var(--primary)", "var(--green)", "var(--amber)", "var(--purple)"][i]}` }}>
            <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[11px] text-text-secondary mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category tables */}
      {categories.map((cat) => (
        <Card key={cat.name} className="mb-2.5">
          <CardHeader>
            <CardTitle>{cat.name}</CardTitle>
            <div className="flex gap-1.5 items-center">
              <span className="text-[11px] font-semibold text-text-secondary">{cat.count} indicateurs</span>
              <Button size="sm">+ Ajouter</Button>
            </div>
          </CardHeader>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {cat.cols.map((col, i) => (
                  <th key={i} className="text-left px-2.5 py-[7px] text-[10px] font-semibold uppercase tracking-wide text-text-muted bg-bg border-b border-border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cat.indicators.map((ind, i) => (
                <tr key={i} className="hover:bg-surface-hover">
                  <td className="px-2.5 py-[9px] border-b border-border-light"><strong>{ind.name}</strong></td>
                  <td className="px-2.5 py-[9px] border-b border-border-light">{ind.value}</td>
                  <td className="px-2.5 py-[9px] border-b border-border-light">{ind.target}</td>
                  {ind.trend !== undefined && cat.cols.includes("Tendance") && (
                    <td className="px-2.5 py-[9px] border-b border-border-light" style={{ color: ind.trendColor }}>{ind.trend}</td>
                  )}
                  <td className="px-2.5 py-[9px] border-b border-border-light">{ind.source}</td>
                  <td className="px-2.5 py-[9px] border-b border-border-light">
                    <Badge color={ind.status}>{ind.statusLabel}</Badge>
                  </td>
                  {ind.next && <td className="px-2.5 py-[9px] border-b border-border-light">{ind.next}</td>}
                  <td className="px-2.5 py-[9px] border-b border-border-light">
                    <Button size="sm">Piloter</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
