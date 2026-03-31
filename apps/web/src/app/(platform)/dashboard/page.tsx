"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBadge, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badge";

const kpis = [
  {
    label: "Chiffre d'Affaires",
    value: "847 K\u20AC",
    detail: "vs 783 K\u20AC T1 2025",
    badge: "+8.2%",
    badgeType: "up" as const,
    borderColor: "var(--primary)",
    sparkColor: "#059669",
    sparkData: [62, 68, 71, 75, 73, 78, 80, 83, 85, 89, 92, 95],
  },
  {
    label: "Marge Nette",
    value: "12.4%",
    detail: "Objectif 15%",
    badge: "+1.3 pts",
    badgeType: "up" as const,
    borderColor: "var(--green)",
    sparkColor: "#2563EB",
    sparkData: [9.2, 9.8, 10.1, 10.5, 10.8, 11, 11.2, 11.1, 11.5, 11.8, 12.1, 12.4],
  },
  {
    label: "Empreinte Carbone",
    value: "18.2",
    unit: "tCO2e",
    detail: "vs 20.7 en 2025",
    badge: "\u221212%",
    badgeType: "up" as const,
    borderColor: "var(--amber)",
    sparkColor: "#059669",
    sparkData: [24, 23.5, 22.8, 22.1, 21.5, 21, 20.7, 20.2, 19.8, 19.3, 18.7, 18.2],
  },
  {
    label: "Satisfaction Equipe",
    value: "7.1",
    unit: "/ 10",
    detail: "Seuil Niv.3 : \u2265 7.5",
    badge: "=",
    badgeType: "neutral" as const,
    borderColor: "var(--purple)",
    sparkColor: "#D97706",
    sparkData: [6.5, 6.6, 6.7, 6.8, 6.9, 6.9, 7, 7, 7, 7.1, 7, 7.1],
  },
];

const badgeStyles = {
  up: "bg-green-bg text-green",
  down: "bg-red-bg text-red",
  neutral: "bg-amber-bg text-amber",
};

const hosmonyLevels = [
  { num: 1, color: "var(--hosmony-1)", active: false, done: true },
  { num: 2, color: "var(--hosmony-2)", active: true, done: false },
  { num: 3, color: "var(--hosmony-3)", active: false, done: false },
  { num: 4, color: "var(--hosmony-4)", active: false, done: false },
  { num: 5, color: "var(--hosmony-5)", active: false, done: false },
];

export default function DashboardPage() {
  const [showAI, setShowAI] = useState(false);

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Boulangerie Martin</div>
          <div className="text-xs text-text-secondary mt-0.5">
            Derniere mise a jour : 28 mars 2026 &bull; T1 2026
          </div>
        </div>
      </div>

      {/* HOSMONY Level Banner */}
      <div className="flex gap-2 mb-4 items-center">
        <div className="flex items-center gap-2 px-3.5 py-2 bg-primary-bg border border-primary rounded-[var(--radius)] flex-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[15px] text-white"
            style={{ background: "var(--primary)" }}
          >
            2
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold">
              Niveau 2 &mdash; Dynamique
            </div>
            <div className="text-[11px] text-text-secondary">
              7/9 etapes &bull; Score 47/100
            </div>
          </div>
          <div className="flex gap-[3px]">
            {hosmonyLevels.map((l) => (
              <div
                key={l.num}
                className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white"
                style={{
                  background: l.color,
                  opacity: l.active ? 1 : l.done ? 0.4 : 0.15,
                }}
              >
                {l.num}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {kpis.map((kpi, i) => {
          const max = Math.max(...kpi.sparkData);
          return (
            <div
              key={i}
              className="bg-surface border border-border rounded-[var(--radius)] p-3.5 shadow relative hover:-translate-y-0.5 hover:shadow-md transition-all"
              style={{ borderTop: `3px solid ${kpi.borderColor}` }}
            >
              <div
                className={`absolute top-3 right-3 text-[10px] font-semibold px-1.5 py-[1px] rounded ${badgeStyles[kpi.badgeType]}`}
              >
                {kpi.badge}
              </div>
              <div className="text-[11px] font-medium text-text-muted mb-1">
                {kpi.label}
              </div>
              <div className="text-[22px] font-extrabold tracking-tight">
                {kpi.value}
                {kpi.unit && (
                  <small className="text-[13px] font-normal"> {kpi.unit}</small>
                )}
              </div>
              <div className="text-[11px] text-text-secondary mt-[1px]">
                {kpi.detail}
              </div>
              {/* Sparkline */}
              <div className="mt-2 h-6 flex items-end gap-[1px]">
                {kpi.sparkData.map((v, j) => (
                  <div
                    key={j}
                    className="flex-1 rounded-t-[1px] min-h-[1px]"
                    style={{
                      height: `${(v / max) * 100}%`,
                      background:
                        j === kpi.sparkData.length - 1
                          ? kpi.sparkColor
                          : kpi.sparkColor + "20",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        {/* Plan d'Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Plan d&apos;Actions</CardTitle>
            <CardBadge>5/12</CardBadge>
          </CardHeader>
          <CardBody>
            <div className="space-y-0">
              <div className="py-2 border-b border-border-light flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0 bg-primary" />
                <div className="flex-1">
                  <div className="text-xs font-semibold">
                    Bilan carbone Scope 1+2
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    <Tag color="red">Haute</Tag> &bull; M. Martin &bull; 15
                    avr.
                  </div>
                </div>
              </div>
              <div className="py-2 border-b border-border-light flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0 bg-primary" />
                <div className="flex-1">
                  <div className="text-xs font-semibold">
                    Comite RSE trimestriel
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    <Tag color="amber">Moy.</Tag> &bull; Direction &bull; 30
                    avr.
                  </div>
                </div>
              </div>
              <div className="py-2 border-b border-border-light flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0 bg-green" />
                <div className="flex-1">
                  <div className="text-xs font-semibold line-through text-text-muted">
                    Formaliser strategie RSE
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    12 mars
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <Button size="sm" className="w-full justify-center">
                Voir tout le plan d&apos;actions &rarr;
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* HOSMONY Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Etapes HOSMONY &mdash; Niveau 2</CardTitle>
            <CardBadge>7/9</CardBadge>
          </CardHeader>
          <CardBody>
            <div className="space-y-0">
              <div className="py-2 border-b border-border-light flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  &#10003;
                </div>
                <div className="flex-1 text-xs font-semibold">
                  Formation HOSMONY Niv.2
                </div>
                <div className="text-[11px] font-medium text-green">
                  Validee
                </div>
              </div>
              <div className="py-2 border-b border-border-light flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  &#10003;
                </div>
                <div className="flex-1 text-xs font-semibold">
                  Consultation citoyenne : Gouvernance
                </div>
                <div className="text-[11px] font-medium text-green">
                  Validee
                </div>
              </div>
              <div className="py-2 border-b border-border-light flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-bg text-amber border-[1.5px] border-amber flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  6
                </div>
                <div className="flex-1 text-xs font-semibold">
                  Definition valeurs et raison d&apos;etre
                </div>
                <div className="text-[11px] font-medium text-amber">
                  En cours
                </div>
              </div>
              <div className="py-2 border-b border-border-light flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-bg text-text-muted border border-border flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  7
                </div>
                <div className="flex-1 text-xs font-semibold">
                  Ambitions DURABILITE
                </div>
                <div className="text-[11px] font-medium text-text-muted">
                  A faire
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAI(!showAI)}
              className="w-full py-2 bg-primary text-white rounded-[var(--radius-sm)] text-xs font-semibold cursor-pointer mt-2 hover:bg-primary-hover"
            >
              Recommandation IA
            </button>

            {showAI && (
              <div className="mt-2 p-2.5 bg-bg border border-border rounded-[var(--radius-sm)] text-xs leading-relaxed">
                <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">
                  Recommandation IA
                </div>
                <p>
                  <strong>Priorite : Formation.</strong> 14h/20h requis. Lancez
                  le e-learning des avril.{" "}
                  <strong>Niveau 3 realiste d&apos;ici juin 2026</strong> &rarr; 3
                  appels d&apos;offres + credit impot ~8 500&euro;.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
