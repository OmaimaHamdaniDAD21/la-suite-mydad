"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pillars = [
  {
    name: "Performance Financiere",
    color: "var(--primary)",
    count: 3,
    objectives: [
      { title: "CA \u2265 1.2M\u20AC", kpi: "847K", pct: 71, pctColor: "var(--green)", dotColor: "var(--green)" },
      { title: "Marge \u2265 15%", kpi: "12.4%", pct: 83, pctColor: "var(--green)", dotColor: "var(--green)" },
      { title: "Tresorerie 3 mois", kpi: "2.1 m.", pct: 70, pctColor: "var(--amber)", dotColor: "var(--amber)" },
    ],
  },
  {
    name: "Transition Ecologique",
    color: "var(--green)",
    count: 4,
    objectives: [
      { title: "Carbone \u221220%", kpi: "\u221212%", pct: 60, pctColor: "var(--green)", dotColor: "var(--green)" },
      { title: "Zero gaspillage", kpi: "\u221235%", pct: 70, pctColor: "var(--green)", dotColor: "var(--green)" },
      { title: "Fournisseurs <100km", kpi: "72%", pct: 72, pctColor: "var(--amber)", dotColor: "var(--amber)" },
      { title: "Energie renouv. 50%", kpi: "38%", pct: 76, pctColor: "var(--green)", dotColor: "var(--green)" },
    ],
  },
  {
    name: "Capital Humain",
    color: "var(--purple)",
    count: 4,
    objectives: [
      { title: "Formation \u2265 20h", kpi: "14h", pct: 70, pctColor: "var(--red)", dotColor: "var(--red)" },
      { title: "Satisfaction \u2265 8", kpi: "7.1", pct: 89, pctColor: "var(--amber)", dotColor: "var(--amber)" },
      { title: "Turnover < 10%", kpi: "7.2%", pct: 100, pctColor: "var(--green)", dotColor: "var(--green)" },
      { title: "Parite", kpi: "40%F", pct: 100, pctColor: "var(--green)", dotColor: "var(--green)" },
    ],
  },
];

export default function StrategiePage() {
  const [showAI, setShowAI] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Strategie</div>
          <div className="text-xs text-text-secondary mt-0.5">Vision, mission, piliers et execution</div>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={() => setShowAI(!showAI)}>Revue IA</Button>
          <Button variant="primary">Modifier la strategie</Button>
        </div>
      </div>

      {/* Vision */}
      <div className="bg-surface border border-border rounded-[var(--radius)] p-4 px-[18px] mb-4 shadow relative">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1">Vision 2028</div>
        <p className="text-sm font-medium leading-relaxed">
          Devenir la boulangerie de reference de la region en alliant excellence artisanale, performance economique et engagement environnemental.
        </p>
        <div className="absolute top-3 right-3">
          <Button size="sm">Modifier</Button>
        </div>
      </div>

      {/* Mission & Values */}
      <div className="grid grid-cols-2 gap-3.5 mb-3">
        <Card>
          <CardHeader>
            <CardTitle>Mission</CardTitle>
            <Button size="sm">Modifier</Button>
          </CardHeader>
          <CardBody>
            <p className="text-xs">
              Produire des pains et patisseries artisanaux de qualite en minimisant notre impact environnemental tout en maximisant le bien-etre de nos equipes.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Valeurs</CardTitle>
            <Button size="sm">Modifier</Button>
          </CardHeader>
          <CardBody>
            <div className="flex gap-[5px] flex-wrap">
              <Badge color="blue">Excellence artisanale</Badge>
              <Badge color="green">Responsabilite ecologique</Badge>
              <Badge color="purple">Bien-etre au travail</Badge>
              <Badge color="amber">Ancrage local</Badge>
            </div>
            <div className="mt-1.5">
              <Button size="sm">+ Ajouter une valeur</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* AI Review */}
      {showAI && (
        <div className="p-2.5 bg-bg border border-border rounded-[var(--radius-sm)] text-xs leading-relaxed mb-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">Revue IA T1 2026</div>
          <p>
            <strong>Forces :</strong> Financier +8.2%, Ecologique &minus;12% carbone.{" "}
            <strong>Vigilance :</strong> Social en retard (14h/20h formation).{" "}
            <strong>Action :</strong> Prioriser RH au T2, securiser tresorerie 3 mois.
          </p>
        </div>
      )}

      {/* Pillars */}
      <div className="grid grid-cols-3 gap-2.5">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="bg-surface border border-border rounded-[var(--radius)] shadow overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-border flex items-center gap-2">
              <div className="w-[3px] h-5 rounded-full flex-shrink-0" style={{ background: pillar.color }} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{pillar.name}</div>
                <div className="text-[9px] text-text-muted">{pillar.count} objectifs</div>
              </div>
              <Button size="sm">Modifier</Button>
            </div>
            <div className="px-3.5 py-2.5">
              {pillar.objectives.map((obj, i) => (
                <div key={i} className="py-1.5 border-b border-border-light last:border-b-0 flex items-center gap-1.5">
                  <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: obj.dotColor }} />
                  <div className="text-[11px] font-medium flex-1">{obj.title}</div>
                  <div className="text-[10px] text-text-secondary">{obj.kpi}</div>
                  <div className="text-[10px] font-bold" style={{ color: obj.pctColor }}>{obj.pct}%</div>
                </div>
              ))}
              <div className="pt-1.5">
                <Button size="sm" className="w-full justify-center">+ Objectif</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
