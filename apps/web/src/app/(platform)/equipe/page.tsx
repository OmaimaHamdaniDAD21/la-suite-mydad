"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const stats = [
  { val: "72%", label: "Engagement", color: "var(--green)" },
  { val: "3", label: "Initiatives", color: "var(--text)" },
  { val: "6/8", label: "Collaborateurs", color: "var(--text)" },
  { val: "12", label: "Idees soumises", color: "var(--text)" },
];

const initiatives = [
  {
    title: "Challenge Eco-Gestes",
    status: "Actif",
    statusColor: "green" as const,
    desc: "Reduire eau et energie au quotidien.",
    detail: "7/8 participants \u2022 Fin 30 avril",
    progress: 75,
    progressColor: "var(--green)",
    actions: [
      { label: "Voir le classement", primary: true },
      { label: "Rejoindre", primary: false },
    ],
  },
  {
    title: "Boite a idees RSE",
    status: "Actif",
    statusColor: "green" as const,
    desc: "Proposez vos idees d'amelioration.",
    detail: "12 soumises \u2022 4 retenues \u2022 2 en cours",
    progress: 33,
    progressColor: "var(--primary)",
    actions: [
      { label: "Soumettre une idee", primary: true },
      { label: "Voir les idees", primary: false },
      { label: "Voter", primary: false },
    ],
  },
  {
    title: "Comite RSE",
    status: "A venir",
    statusColor: "amber" as const,
    desc: "Reunion trimestrielle de pilotage.",
    detail: "15 avril 2026 \u2022 4 membres",
    actions: [
      { label: "Planifier la reunion", primary: true },
      { label: "Voir les PV", primary: false },
      { label: "Inviter", primary: false },
    ],
  },
];

export default function EquipePage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Equipe</div>
          <div className="text-xs text-text-secondary mt-0.5">Engagement, challenges et initiatives collaborateurs</div>
        </div>
        <Button variant="primary">+ Nouvelle initiative</Button>
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

      {/* Initiatives */}
      <div className="grid grid-cols-3 gap-2.5">
        {initiatives.map((init) => (
          <Card key={init.title}>
            <CardHeader>
              <CardTitle>{init.title}</CardTitle>
              <Badge color={init.statusColor}>{init.status}</Badge>
            </CardHeader>
            <CardBody>
              <p className="text-[11px] text-text-secondary mb-1.5">{init.desc}</p>
              <div className="text-[11px]">
                <strong>{init.detail}</strong>
              </div>
              {init.progress !== undefined && (
                <Progress value={init.progress} color={init.progressColor} className="mt-[5px] mb-2" />
              )}
              <div className="flex gap-1 mt-2">
                {init.actions.map((a) => (
                  <Button key={a.label} size="sm" variant={a.primary ? "primary" : "default"}>
                    {a.label}
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
