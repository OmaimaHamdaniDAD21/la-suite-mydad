"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const journeyLevels = [
  { num: 1, name: "Essentiel", desc: "6/6 \u2022 Valide", color: "var(--hosmony-1)", status: "done" },
  { num: 2, name: "Dynamique", desc: "7/9 \u2022 En cours", color: "var(--hosmony-2)", status: "current" },
  { num: 3, name: "Performance", desc: "KPIs & certif.", color: "var(--hosmony-3)", status: "future" },
  { num: 4, name: "Excellence", desc: "Innovation", color: "var(--hosmony-4)", status: "future" },
  { num: 5, name: "Etoile", desc: "Modele", color: "var(--hosmony-5)", status: "future" },
];

const level2Steps = [
  { num: "done", title: "Formation HOSMONY Niveau 2", desc: "Je construis ma strategie \u2014 2 jours", status: "Validee" },
  { num: "done", title: "Consultation citoyenne : Gouvernance", desc: "", status: "Validee" },
  { num: "done", title: "E-learning niveau 2", desc: "Approfondissement et mise a jour reglementaire", status: "Validee" },
  { num: "done", title: "Diagnostic progression durabilite accompagne", desc: "", status: "Validee" },
  { num: "done", title: "Analyse indicateur durabilite niveau 2", desc: "", status: "Validee" },
  { num: "current", title: "Definition des valeurs et raison d'etre", desc: "Definir les valeurs fondamentales de l'entreprise", status: "continue" },
  { num: "locked", title: "Ambitions DURABILITE (carte mentale)", desc: "Formaliser les ambitions via carte mentale", status: "locked" },
  { num: "done", title: "E-learning complementaire", desc: "", status: "Validee" },
  { num: "done", title: "Bilan niveau 2", desc: "", status: "Validee" },
];

const level1Steps = [
  { title: "Sensibilisation HOSMONY" },
  { title: "Consultation citoyenne" },
  { title: "E-learning initial durabilite" },
  { title: "Autodiagnostic progression durabilite" },
  { title: "Analyse indicateur durabilite" },
  { title: "Rapport de progression niveau 1" },
];

export default function ParcoursPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Parcours HOSMONY</div>
          <div className="text-xs text-text-secondary mt-0.5">
            Niveau actuel : 2 &mdash; Dynamique &bull; 7/9 etapes validees
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button>Historique</Button>
          <Button variant="primary">Lancer le pre-audit</Button>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="flex gap-0 mb-5 relative">
        {journeyLevels.map((level, i) => (
          <div key={level.num} className="flex-1 text-center relative">
            <div
              className={`w-11 h-11 rounded-[var(--radius)] flex items-center justify-center text-lg font-extrabold text-white mx-auto mb-1.5 relative z-[2] ${
                level.status === "current" ? "outline outline-2 outline-offset-2" : ""
              }`}
              style={{
                background: level.color,
                opacity: level.status === "done" ? 0.4 : level.status === "future" ? 0.12 : 1,
                outlineColor: level.status === "current" ? level.color : "transparent",
              }}
            >
              {level.num}
            </div>
            <div className="text-[11px] font-semibold">{level.name}</div>
            <div className="text-[10px] text-text-muted">{level.desc}</div>
            {i < journeyLevels.length - 1 && (
              <div
                className="absolute top-[22px] h-0.5 z-[1]"
                style={{
                  left: "calc(50% + 26px)",
                  right: "calc(-50% + 26px)",
                  background:
                    level.status === "done"
                      ? "var(--green)"
                      : level.status === "current"
                        ? "linear-gradient(90deg, var(--primary), var(--border))"
                        : "var(--border)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Level 2 Steps */}
      <Card className="mb-3.5">
        <CardHeader>
          <CardTitle>Etapes &mdash; Niveau 2 : Dynamique</CardTitle>
          <div className="text-[11px] font-semibold text-text-secondary">7/9</div>
        </CardHeader>
        <CardBody>
          {level2Steps.map((step, i) => (
            <div key={i} className="py-2 border-b border-border-light last:border-b-0 flex items-center gap-2.5">
              {step.num === "done" ? (
                <div className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">&#10003;</div>
              ) : step.num === "current" ? (
                <div className="w-6 h-6 rounded-full bg-amber-bg text-amber border-[1.5px] border-amber flex items-center justify-center text-[10px] font-bold flex-shrink-0">6</div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-bg text-text-muted border border-border flex items-center justify-center text-[10px] font-bold flex-shrink-0">7</div>
              )}
              <div className="flex-1">
                <div className="text-xs font-semibold">{step.title}</div>
                {step.desc && <div className="text-[11px] text-text-secondary">{step.desc}</div>}
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                {step.status === "Validee" && (
                  <>
                    <span className="text-[11px] font-medium text-green">Validee</span>
                    <Button size="sm" variant="ghost">Voir</Button>
                  </>
                )}
                {step.status === "continue" && <Button size="sm" variant="primary">Continuer</Button>}
                {step.status === "locked" && (
                  <Button size="sm" disabled>Verrouille</Button>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Level 1 Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Etapes &mdash; Niveau 1 : Essentiel</CardTitle>
          <div className="flex items-center gap-2">
            <Badge color="green">6/6 &#10003;</Badge>
            <Button size="sm" variant="ghost">Voir le rapport</Button>
          </div>
        </CardHeader>
        <CardBody>
          {level1Steps.map((step, i) => (
            <div key={i} className="py-2 border-b border-border-light last:border-b-0 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">&#10003;</div>
              <div className="flex-1 text-xs font-semibold">{step.title}</div>
              <span className="text-[11px] font-medium text-green">Validee</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
