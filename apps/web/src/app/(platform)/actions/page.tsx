"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";

type Priority = "Haute" | "Moy." | "Basse";
const priorityColors: Record<Priority, "red" | "amber" | "green"> = {
  Haute: "red",
  "Moy.": "amber",
  Basse: "green",
};

interface KCard {
  title: string;
  priority: Priority;
  date: string;
  avatar: string;
  avatarColor: string;
  details: { label: string; value: string }[];
  completed?: boolean;
}

const columns: { name: string; count: number; cards: KCard[] }[] = [
  {
    name: "A faire",
    count: 3,
    cards: [
      { title: "Plan formation 20h/an", priority: "Moy.", date: "30 juin", avatar: "AM", avatarColor: "var(--amber)", details: [{ label: "Indicateur", value: "14h/20h" }, { label: "Mesure", value: "PayFit" }, { label: "Budget", value: "3 200\u20AC" }, { label: "Resp.", value: "A. Morel" }] },
      { title: "Compteurs energetiques", priority: "Basse", date: "15 juil.", avatar: "MM", avatarColor: "var(--green)", details: [{ label: "Indicateur", value: "kWh/mois" }, { label: "Mesure", value: "IoT" }, { label: "Budget", value: "1 800\u20AC" }, { label: "Resp.", value: "M. Martin" }] },
      { title: "Charte RSE", priority: "Basse", date: "30 juil.", avatar: "SL", avatarColor: "var(--text)", details: [{ label: "Indicateur", value: "Document" }, { label: "Mesure", value: "Validation" }, { label: "Budget", value: "0\u20AC" }, { label: "Resp.", value: "S. Laurent" }] },
    ],
  },
  {
    name: "En cours",
    count: 4,
    cards: [
      { title: "Bilan carbone Scope 1+2", priority: "Haute", date: "15 avr.", avatar: "MM", avatarColor: "var(--green)", details: [{ label: "Indicateur", value: "tCO2e" }, { label: "Mesure", value: "ADEME" }, { label: "Budget", value: "4 500\u20AC" }, { label: "Resp.", value: "M. Martin" }] },
      { title: "Comite RSE trimestriel", priority: "Moy.", date: "30 avr.", avatar: "DIR", avatarColor: "var(--purple)", details: [{ label: "Indicateur", value: "4 reunions" }, { label: "Mesure", value: "PV" }, { label: "Budget", value: "0\u20AC" }, { label: "Resp.", value: "Direction" }] },
      { title: "Enquete satisfaction", priority: "Moy.", date: "15 mai", avatar: "AM", avatarColor: "var(--amber)", details: [{ label: "Indicateur", value: "Score /10" }, { label: "Mesure", value: "Questionnaire" }, { label: "Budget", value: "200\u20AC" }, { label: "Resp.", value: "A. Morel" }] },
    ],
  },
  {
    name: "En revue",
    count: 0,
    cards: [],
  },
  {
    name: "Completees",
    count: 5,
    cards: [
      { title: "Formaliser strategie RSE", priority: "Moy.", date: "12 mars", avatar: "", avatarColor: "", details: [], completed: true },
      { title: "Centraliser donnees comptables", priority: "Moy.", date: "28 fev.", avatar: "", avatarColor: "", details: [], completed: true },
    ],
  },
];

export default function ActionsPage() {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Plan d&apos;Actions</div>
          <div className="text-xs text-text-secondary mt-0.5">
            12 actions &bull; 5 completees &bull; 4 en cours &bull; 3 a faire
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={() => setShowSuggestions(!showSuggestions)}>Suggestions IA</Button>
          <Button>Filtrer</Button>
          <Button variant="primary">+ Nouvelle action</Button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {columns.map((col) => (
          <div key={col.name} className="bg-bg border border-border rounded-[var(--radius)]">
            <div className="px-2.5 py-2 text-[11px] font-bold border-b border-border flex justify-between items-center">
              {col.name}
              <span className="text-[10px] font-semibold text-text-muted">{col.count}</span>
            </div>
            <div className="p-1.5 flex flex-col gap-[5px]">
              {col.cards.length === 0 && (
                <div className="text-center py-5 px-3 text-text-muted text-xs">
                  <CheckSquare size={24} className="mx-auto mb-1.5 text-border" strokeWidth={1.5} />
                  Aucune action en revue
                </div>
              )}
              {col.cards.map((card, i) => (
                <div
                  key={i}
                  className={`bg-surface border border-border rounded-[var(--radius-sm)] px-3 py-2.5 shadow ${card.completed ? "opacity-40" : ""}`}
                >
                  <div className={`text-xs font-semibold mb-[5px] ${card.completed ? "line-through" : ""}`}>{card.title}</div>
                  <div className="flex gap-[5px] items-center flex-wrap text-[11px]">
                    {!card.completed && <Tag color={priorityColors[card.priority]}>{card.priority}</Tag>}
                    <span className="text-[9px] text-text-muted">{card.completed ? "" : ""}{card.date}</span>
                    {card.completed && <span className="text-[9px] text-green">{card.date}</span>}
                    {card.avatar && (
                      <div
                        className="w-[18px] h-[18px] rounded-full text-[8px] font-bold text-white flex items-center justify-center ml-auto"
                        style={{ background: card.avatarColor }}
                      >
                        {card.avatar}
                      </div>
                    )}
                  </div>
                  {card.details.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-border-light text-[11px] text-text-secondary flex flex-wrap gap-x-2.5 gap-y-0.5">
                      {card.details.map((d, j) => (
                        <div key={j}>
                          {d.label} : <strong className="text-text font-semibold">{d.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Suggestions */}
      {showSuggestions && (
        <div className="p-2.5 bg-bg border border-border rounded-[var(--radius-sm)] text-xs leading-relaxed">
          <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">Suggestions IA</div>
          <p><strong>1. E-learning accelere</strong> (impact 9/10) &mdash; Combler les 6h manquantes. ROI : FNE ~3 200&euro;.</p>
          <p><strong>2. Pre-audit flash IA</strong> (impact 8/10) &mdash; Identifier ecarts, ~2h.</p>
          <p><strong>3. ISO 14001</strong> (impact 7/10) &mdash; 70% des exigences deja atteintes.</p>
        </div>
      )}
    </div>
  );
}
