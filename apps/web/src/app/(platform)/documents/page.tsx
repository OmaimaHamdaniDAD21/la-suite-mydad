"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const stats = [
  { val: "67%", label: "Readiness Audit", color: "var(--green)" },
  { val: "12", label: "Documents (8 valides)" },
  { val: "15 mai", label: "Prochain pre-audit" },
  { val: "1", label: "Rapport genere" },
];

const reports = [
  { num: "done", title: "Rapport Niveau 1 \u2014 Essentiel", desc: "14 pages \u2022 Genere le 15 fev.", status: "done" },
  { num: "current", title: "Rapport Niveau 2 \u2014 Dynamique", desc: "Sera genere a la validation du bilan niv.2", status: "pending" },
];

const documents = [
  { name: "Bilan comptable 2025", type: "Financier", typeColor: "blue" as const, step: "CA \u2265 5%", status: "Valide", statusColor: "green" as const, date: "15 fev.", canShare: true },
  { name: "Strategie RSE", type: "Strategie", typeColor: "purple" as const, step: "Formalisation", status: "Valide", statusColor: "green" as const, date: "12 mars", canShare: true },
  { name: "Factures energie", type: "Enviro.", typeColor: "green" as const, step: "Reduction", status: "Valide", statusColor: "green" as const, date: "28 mars", canShare: false },
  { name: "Bilan carbone Scope 1+2", type: "Enviro.", typeColor: "green" as const, step: "Bilan carbone", status: "En attente", statusColor: "amber" as const, date: "\u2014", canImport: true },
  { name: "PV Comite RSE Q1", type: "Gouv.", typeColor: "purple" as const, step: "Comite RSE", status: "Valide", statusColor: "green" as const, date: "25 mars", canShare: false },
];

export default function DocumentsPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Documents & Audit</div>
          <div className="text-xs text-text-secondary mt-0.5">Centre documentaire et suivi audit</div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="primary">Generer rapport durabilite</Button>
          <Button>+ Importer document</Button>
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

      {/* Reports */}
      <Card className="mb-2.5">
        <CardHeader>
          <CardTitle>Rapports de Durabilite IA</CardTitle>
          <Button size="sm" variant="primary">Generer un nouveau rapport</Button>
        </CardHeader>
        <CardBody>
          {reports.map((r, i) => (
            <div key={i} className="py-2 border-b border-border-light last:border-b-0 flex items-center gap-2.5">
              {r.num === "done" ? (
                <div className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">&#10003;</div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-bg text-amber border-[1.5px] border-amber flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</div>
              )}
              <div className="flex-1">
                <div className="text-xs font-semibold">{r.title}</div>
                <div className="text-[11px] text-text-secondary">{r.desc}</div>
              </div>
              {r.status === "done" ? (
                <div className="flex gap-1.5">
                  <Button size="sm">Telecharger</Button>
                  <Button size="sm" variant="ghost">Partager</Button>
                </div>
              ) : (
                <Badge color="amber">En attente</Badge>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Audit Preparation */}
      <Card className="mb-2.5">
        <CardHeader>
          <CardTitle>Preparation Audit</CardTitle>
          <div className="text-[11px] font-semibold text-text-secondary">Pre-audit 15 mai</div>
        </CardHeader>
        <CardBody>
          <div className="text-[11px] mb-1">67% pret</div>
          <Progress value={67} color="var(--green)" className="mb-2" />
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div><strong className="text-green">8</strong> documents conformes</div>
            <div><strong className="text-amber">3</strong> en attente</div>
            <div>
              <strong className="text-red">1</strong> manquant &mdash;{" "}
              <a href="#" className="text-primary no-underline font-semibold">Importer</a>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* All Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les documents</CardTitle>
          <div className="flex gap-1.5">
            <Button size="sm">Filtrer</Button>
            <Button size="sm">+ Importer</Button>
          </div>
        </CardHeader>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {["Document", "Type", "Etape", "Statut", "Date", ""].map((col) => (
                <th key={col} className="text-left px-2.5 py-[7px] text-[10px] font-semibold uppercase tracking-wide text-text-muted bg-bg border-b border-border">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, i) => (
              <tr key={i} className="hover:bg-surface-hover">
                <td className="px-2.5 py-[9px] border-b border-border-light"><strong>{doc.name}</strong></td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <Badge color={doc.typeColor}>{doc.type}</Badge>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border-light">{doc.step}</td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <Badge color={doc.statusColor}>{doc.status}</Badge>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border-light">{doc.date}</td>
                <td className="px-2.5 py-[9px] border-b border-border-light">
                  <div className="flex gap-1">
                    {doc.canImport ? (
                      <Button size="sm" variant="primary">Importer</Button>
                    ) : (
                      <Button size="sm">Voir</Button>
                    )}
                    {doc.canShare && <Button size="sm" variant="ghost">Partager</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
