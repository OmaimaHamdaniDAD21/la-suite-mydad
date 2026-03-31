"use client";

import { Button } from "@/components/ui/button";
import { FileText, Briefcase, BarChart3, Users, Monitor, Mail, Wrench, Code } from "lucide-react";

const connectors = [
  { name: "Pennylane", desc: "Compta, facturation, tresorerie", icon: FileText, connected: true },
  { name: "Banque DSP2", desc: "Releves, mouvements, soldes", icon: Briefcase, connected: true },
  { name: "Sage", desc: "Compta, paie, gestion", icon: BarChart3, connected: false },
  { name: "PayFit", desc: "Paie, conges, social", icon: Users, connected: false },
  { name: "Cegid", desc: "ERP, compta, gestion", icon: Monitor, connected: false },
  { name: "HubSpot CRM", desc: "Contacts, pipeline", icon: Mail, connected: false },
  { name: "ACD", desc: "Production comptable", icon: Wrench, connected: false },
  { name: "API Custom", desc: "REST API personnalisee", icon: Code, connected: false },
];

export default function ConnecteursPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Connecteurs API</div>
          <div className="text-xs text-text-secondary mt-0.5">Centralisez vos donnees</div>
        </div>
        <Button variant="primary">+ Ajouter un connecteur</Button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {connectors.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.name}
              className={`bg-surface border rounded-[var(--radius)] p-3.5 text-center shadow ${
                c.connected
                  ? "border-green bg-gradient-to-b from-green-bg to-white"
                  : "border-border hover:border-primary"
              }`}
            >
              <div className="text-[22px] mb-1 flex items-center justify-center h-7">
                <Icon size={24} className={c.connected ? "text-green" : "text-text-secondary"} strokeWidth={1.8} />
              </div>
              <div className="text-xs font-bold">{c.name}</div>
              <div className="text-[10px] text-text-secondary my-0.5 mb-2">{c.desc}</div>
              {c.connected ? (
                <div className="flex gap-1 justify-center">
                  <button className="px-2.5 py-[5px] bg-primary text-white border-primary border rounded-[var(--radius-sm)] text-[11px] font-semibold">
                    Connecte
                  </button>
                  <Button size="sm" variant="ghost">Configurer</Button>
                </div>
              ) : (
                <button className="w-full py-1.5 rounded-[var(--radius-sm)] border border-primary text-primary text-[11px] font-semibold cursor-pointer bg-surface hover:bg-primary-bg">
                  {c.name === "API Custom" ? "Configurer" : "Connecter"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
