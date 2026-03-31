"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, DollarSign, Activity, MessageCircle, Search, Users, Send } from "lucide-react";

const agentPills = [
  { id: "commercial", label: "Commercial", icon: Briefcase },
  { id: "comptable", label: "Comptable", icon: DollarSign },
  { id: "marketing", label: "Marketing", icon: Activity },
  { id: "comm", label: "Communication", icon: MessageCircle },
  { id: "seo", label: "SEO", icon: Search },
  { id: "rh", label: "RH", icon: Users },
];

const chatHistory = [
  { title: "Potentiel croissance clients", date: "Aujourd'hui", agent: "Commercial", active: true },
  { title: "Analyse marges T1 2026", date: "Hier", agent: "Comptable", active: false },
  { title: "Strategie contenu LinkedIn", date: "27 mars", agent: "Marketing", active: false },
  { title: "Audit SEO boulangerie", date: "25 mars", agent: "SEO", active: false },
  { title: "Obligations formation 2026", date: "22 mars", agent: "RH", active: false },
  { title: "Communique presse RSE", date: "20 mars", agent: "Communication", active: false },
];

export default function StudioIAPage() {
  const [activeAgent, setActiveAgent] = useState("commercial");

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Studio IA</div>
          <div className="text-xs text-text-secondary mt-0.5">6 assistants metier connectes a vos donnees</div>
        </div>
        <div className="flex gap-1.5">
          <Button>Configurer</Button>
          <Button variant="primary">+ Creer un agent</Button>
        </div>
      </div>

      {/* Agent pills */}
      <div className="flex gap-1.5 mb-3.5 items-center flex-wrap">
        {agentPills.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={`flex items-center gap-[5px] px-3 py-[5px] rounded-[var(--radius-sm)] border text-[11px] cursor-pointer ${
                isActive ? "bg-primary text-white border-primary font-semibold" : "bg-surface text-text border-border font-medium hover:bg-bg"
              }`}
            >
              <Icon size={13} />
              {agent.label}
            </button>
          );
        })}
      </div>

      {/* Main layout: history + chat */}
      <div className="grid grid-cols-[200px_1fr] gap-3">
        {/* History sidebar */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border flex justify-between items-center">
            <span className="text-[11px] font-bold">Historique</span>
            <Button size="sm" className="px-1.5 py-[2px] text-[10px]">+ Nouveau</Button>
          </div>
          <div className="p-1">
            {chatHistory.map((h, i) => (
              <div
                key={i}
                className={`px-2.5 py-2 rounded-[var(--radius-sm)] cursor-pointer mb-0.5 ${h.active ? "bg-primary-bg" : "hover:bg-bg"}`}
              >
                <div className="text-[11px] font-semibold text-text whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: h.active ? 600 : 500 }}>
                  {h.title}
                </div>
                <div className="text-[10px] text-text-muted mt-[1px]">{h.date} &bull; {h.agent}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chat area */}
        <Card className="flex flex-col min-h-[440px] overflow-hidden">
          {/* Chat header */}
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-text flex items-center justify-center flex-shrink-0">
              <Briefcase size={13} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold">Assistant Commercial</div>
            </div>
            <div className="flex gap-[5px] items-center">
              <Badge color="blue">12 clients</Badge>
              <Badge color="green">T1 2026</Badge>
              <Badge color="purple">Pennylane</Badge>
              <Button size="sm" className="ml-1">Contexte</Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {/* Bot message */}
            <div className="max-w-[82%] px-3.5 py-2.5 rounded-[var(--radius)] rounded-bl text-xs leading-relaxed bg-bg self-start">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">Assistant Commercial</div>
              Bonjour Sophie ! Je suis pret a analyser votre portefeuille. Posez-moi une question sur vos clients, leur potentiel HOSMONY ou les opportunites de croissance.
            </div>

            {/* User message */}
            <div className="max-w-[75%] px-3.5 py-2.5 rounded-[var(--radius)] rounded-br text-xs leading-relaxed bg-primary text-white self-end">
              Quels clients ont le plus fort potentiel de croissance HOSMONY ?
            </div>

            {/* Bot response with structured data */}
            <div className="max-w-[82%] px-3.5 py-2.5 rounded-[var(--radius)] rounded-bl text-xs leading-relaxed bg-bg self-start">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Assistant Commercial</div>
              <strong>Top 3 potentiel de croissance :</strong>

              <div className="my-2 px-2.5 py-2 bg-surface rounded-[var(--radius-sm)] border-l-[3px] border-l-primary">
                <div className="font-semibold">1. Cabinet Dupont</div>
                <div className="text-[11px] text-text-secondary">Niv.2 &rarr; Niv.3 d&apos;ici 3 mois &bull; CA +12.4% &bull; <strong className="text-green">28K&euro;</strong> d&apos;opportunites</div>
              </div>
              <div className="my-2 px-2.5 py-2 bg-surface rounded-[var(--radius-sm)] border-l-[3px] border-l-green">
                <div className="font-semibold">2. Vignobles Beaumont</div>
                <div className="text-[11px] text-text-secondary">Niv.3, score 62 &bull; 3 appels d&apos;offres bio identifies</div>
              </div>
              <div className="my-2 px-2.5 py-2 bg-surface rounded-[var(--radius-sm)] border-l-[3px] border-l-primary">
                <div className="font-semibold">3. Boulangerie Martin</div>
                <div className="text-[11px] text-text-secondary">Niv.2 &rarr; Niv.3 realiste juin 2026</div>
              </div>
              <div className="mt-2 px-2.5 py-2 bg-red-bg rounded-[var(--radius-sm)] border-l-[3px] border-l-red">
                <div className="font-semibold text-red">Alerte</div>
                <div className="text-[11px] text-text-secondary">Restaurant Le Lys (CA &minus;1.2%) &rarr; plan de redressement recommande</div>
              </div>
            </div>
          </div>

          {/* Suggested prompts */}
          <div className="px-4 py-2 border-t border-border flex gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-text-muted py-1">Suggestions :</span>
            <Button size="sm" className="rounded-full text-[11px]">Clients a risque</Button>
            <Button size="sm" className="rounded-full text-[11px]">Opportunites ce trimestre</Button>
            <Button size="sm" className="rounded-full text-[11px]">Comparer les marges</Button>
          </div>

          {/* Input */}
          <div className="px-4 py-2.5 border-t border-border flex gap-2">
            <input
              type="text"
              placeholder="Posez une question sur votre portefeuille..."
              className="flex-1 px-3 py-2 border border-border rounded-[var(--radius)] text-xs outline-none focus:border-text"
            />
            <button className="px-4 py-2 bg-primary text-white border-none rounded-[var(--radius)] text-xs font-semibold cursor-pointer flex items-center gap-1.5">
              <Send size={13} />
              Envoyer
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
