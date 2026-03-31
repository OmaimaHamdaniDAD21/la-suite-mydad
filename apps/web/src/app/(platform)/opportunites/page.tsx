"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BookOpen, DollarSign, GraduationCap, Star } from "lucide-react";

const agents = [
  { id: "reglem", label: "Reglementaire", icon: BookOpen, disabled: false },
  { id: "finance", label: "Financement", icon: DollarSign, disabled: false },
  { id: "business", label: "Business", icon: GraduationCap, disabled: true, level: "Niv.3" },
  { id: "image", label: "Image", icon: Star, disabled: true, level: "Niv.4" },
];

const reglementations = [
  {
    title: "NIS2, CRA, IA Act : le nouveau cadre reglementaire cyber",
    risk: "amber",
    riskLabel: "Risque moyen",
    date: "1 septembre 2026",
    tags: ["cybersecurite", "reglementation", "IA", "NIS2"],
    desc: "Ce document presente le nouvel ensemble de reglementations europeennes relatives a la cybersecurite et a l'intelligence artificielle.",
  },
  {
    title: "Mise a jour normes d'hygiene alimentaire 2026",
    risk: "red",
    riskLabel: "Risque eleve",
    date: "1 juillet 2026",
    tags: ["hygiene", "alimentaire", "DDPP"],
    desc: "Nouvelles exigences en matiere de tracabilite et de controle des temperatures. Sanctions renforcees en cas de non-conformite.",
  },
  {
    title: "Obligation de tri des biodechets (loi AGEC)",
    risk: "green",
    riskLabel: "Conforme",
    date: "En vigueur",
    tags: ["dechets", "AGEC", "alimentaire"],
    desc: "Obligation de tri a la source des biodechets pour tous les producteurs. Votre entreprise est en conformite.",
  },
];

const financements = [
  {
    title: "Aide regionale transition ecologique",
    org: "Region Ile-de-France",
    type: "Subvention",
    match: 71,
    matchColor: "var(--primary)",
    amount: "Jusqu'a 12 000 \u20AC",
    deadline: "31 decembre 2026",
    desc: "Soutien aux PME dans leur transition ecologique avec un accompagnement technique et financier pour les demarches RSE.",
  },
  {
    title: "FNE-Formation \u2014 Transition ecologique",
    org: "OPCO \u2014 Ministere du Travail",
    type: "Aide directe",
    match: 85,
    matchColor: "var(--green)",
    amount: "Jusqu'a 3 200 \u20AC",
    deadline: "30 juin 2026",
    desc: "Financement des formations liees a la transition ecologique pour les salaries. Prise en charge jusqu'a 100%.",
  },
  {
    title: "Prime eco-energie (CEE)",
    org: "Certificats d'Economies d'Energie",
    type: "Obtenue",
    amount: "18 000 \u20AC",
    desc: "Prime obtenue en decembre 2025 pour le remplacement du four et l'isolation du local de production.",
    obtained: true,
  },
];

export default function OpportunitesPage() {
  const [activeAgent, setActiveAgent] = useState("reglem");

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Opportunites</div>
          <div className="text-xs text-text-secondary mt-0.5">Agents HOSMONY debloques par niveau</div>
        </div>
      </div>

      {/* Agent tabs */}
      <div className="flex gap-1.5 mb-[18px] items-center">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => !agent.disabled && setActiveAgent(agent.id)}
              disabled={agent.disabled}
              className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-[var(--radius-sm)] border text-xs font-medium cursor-pointer ${
                agent.disabled ? "opacity-50 cursor-not-allowed text-text-muted border-border bg-surface" : isActive ? "bg-primary text-white border-primary font-semibold" : "bg-surface text-text border-border hover:border-text-muted"
              }`}
            >
              <Icon size={14} />
              {agent.label}
              {agent.level && <Badge color="gray" className="text-[9px] px-[5px] py-[1px]">{agent.level}</Badge>}
            </button>
          );
        })}
      </div>

      {/* Reglementaire */}
      {activeAgent === "reglem" && (
        <div>
          <div className="flex items-center gap-3 mb-[18px]">
            <div>
              <div className="text-[15px] font-bold">Veille reglementaire</div>
              <div className="text-xs text-text-secondary">RSE, ESG et obligations sectorielles pour votre entreprise</div>
            </div>
            <div className="ml-auto flex gap-1.5">
              <Button>Exporter</Button>
              <Button variant="primary">Actualiser la veille</Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-[18px]">
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-primary text-white rounded-[var(--radius-sm)] font-semibold">Reglementations <strong>19</strong></span>
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-bg text-text-muted rounded-[var(--radius-sm)]">Calendrier <strong>3</strong></span>
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-bg text-text-muted rounded-[var(--radius-sm)]">Evolutions sectorielles <strong>6</strong></span>
            <div className="flex-1" />
            <select className="px-2.5 py-1.5 border border-border rounded-[var(--radius-sm)] text-[11px] bg-surface">
              <option>Tous les risques</option>
              <option>Risque eleve</option>
              <option>Risque moyen</option>
            </select>
            <input className="px-2.5 py-1.5 border border-border rounded-[var(--radius-sm)] text-[11px] w-[180px]" placeholder="Rechercher..." />
          </div>

          {reglementations.map((reg, i) => (
            <Card key={i} className="mb-3 p-4">
              <div className="flex gap-2 items-center mb-2.5">
                <Badge color="blue">Reglementation</Badge>
                <Badge color={reg.risk as "green" | "amber" | "red"}>{reg.riskLabel}</Badge>
                <div className="ml-auto text-[11px] text-text-muted">{reg.date}</div>
              </div>
              <div className="text-[15px] font-bold mb-1.5">{reg.title}</div>
              <div className="flex gap-1.5 mb-2.5 flex-wrap">
                {reg.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-[3px] bg-bg rounded-full text-text-secondary">{tag}</span>
                ))}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">{reg.desc}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="primary">Analyse IA</Button>
                <Button size="sm">Plan d&apos;actions</Button>
                {i === 0 && <Button size="sm">Voir plus</Button>}
                {i === 2 && <Button size="sm">Voir les preuves</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Financement */}
      {activeAgent === "finance" && (
        <div>
          <div className="flex items-center gap-3 mb-[18px]">
            <div>
              <div className="text-[15px] font-bold">Financements eligibles</div>
              <div className="text-xs text-text-secondary">Subventions, aides et financements pour votre entreprise</div>
            </div>
            <div className="ml-auto flex gap-1.5">
              <Button>Exporter</Button>
              <Button variant="primary">Chercher de nouvelles aides</Button>
            </div>
          </div>

          <input className="w-full px-3.5 py-2.5 border border-border rounded-[var(--radius)] text-xs bg-surface mb-3.5" placeholder="Rechercher un dispositif, un organisme..." />

          <div className="flex gap-2 mb-[18px] flex-wrap">
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-primary text-white rounded-[var(--radius-sm)] font-semibold">Toutes</span>
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-bg text-text-muted rounded-[var(--radius-sm)]">Subvention</span>
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-bg text-text-muted rounded-[var(--radius-sm)]">Credit d&apos;impot</span>
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-bg text-text-muted rounded-[var(--radius-sm)]">Pret</span>
            <span className="px-4 py-1.5 text-xs cursor-pointer bg-bg text-text-muted rounded-[var(--radius-sm)]">Aide directe</span>
          </div>

          <div className="text-[13px] font-bold mb-3.5">5 dispositifs eligibles</div>

          {financements.map((fin, i) => (
            <Card key={i} className={`mb-3 p-4 ${fin.obtained ? "border-l-[3px] border-l-green" : ""}`}>
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <div className="text-[15px] font-bold">{fin.title}</div>
                  <div className="text-[11px] text-text-secondary mt-0.5">{fin.org}</div>
                </div>
                <div className="flex gap-1.5 items-center">
                  {fin.obtained ? (
                    <Badge color="green">Obtenue &mdash; {fin.amount}</Badge>
                  ) : (
                    <>
                      <Badge color="green">{fin.type}</Badge>
                      {"match" in fin && (
                        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: fin.matchColor }}>
                          {fin.match}%
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">{fin.desc}</p>
              {!fin.obtained && "amount" in fin && (
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div className="p-2.5 bg-bg rounded-[var(--radius-sm)]">
                    <div className="text-[10px] font-semibold uppercase text-text-muted">Montant</div>
                    <div className="text-[15px] font-extrabold text-primary">{fin.amount}</div>
                  </div>
                  <div className="p-2.5 bg-bg rounded-[var(--radius-sm)]">
                    <div className="text-[10px] font-semibold uppercase text-text-muted">Echeance</div>
                    <div className="text-[15px] font-extrabold text-text">{"deadline" in fin ? fin.deadline : ""}</div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                {fin.obtained ? (
                  <Button size="sm">Voir le dossier</Button>
                ) : (
                  <>
                    <Button size="sm" variant="primary">Plus d&apos;infos</Button>
                    <Button size="sm">Telecharger</Button>
                    <Button size="sm" variant="primary">Pourquoi suis-je eligible ?</Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
