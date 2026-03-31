"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const notifications = [
  {
    color: "var(--red)",
    title: "Echeance bilan carbone dans 15 jours",
    time: "Il y a 2h",
    category: "Action requise",
  },
  {
    color: "var(--amber)",
    title: "Indicateur formation : 14h/20h",
    time: "Il y a 5h",
    category: "Indicateurs",
  },
  {
    color: "var(--green)",
    title: "Aide numerisation TPE : 5 400\u20AC obtenue",
    time: "Hier",
    category: "Opportunites",
  },
  {
    color: "var(--primary)",
    title: "Etape 6 \u00ABValeurs et raison d\u2019etre\u00BB : rappel",
    time: "28 mars",
    category: "Parcours",
  },
];

export function Topbar() {
  const [showNotif, setShowNotif] = useState(false);

  return (
    <div className="h-12 bg-surface border-b border-border flex items-center justify-between px-5 sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] text-text-secondary">
          Portefeuille &rsaquo;{" "}
          <strong className="text-text font-semibold">
            Boulangerie Martin
          </strong>
        </span>
        <div className="px-2.5 py-1 border border-border rounded-[var(--radius-sm)] text-[11px] font-medium text-text-secondary cursor-pointer hover:border-text-muted">
          &#9662; Changer de client
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-8 h-8 rounded-[var(--radius-sm)] border border-border bg-surface flex items-center justify-center text-text-secondary hover:bg-bg cursor-pointer"
          >
            <Bell size={14} />
            <div className="absolute -top-[3px] -right-[3px] min-w-[14px] h-[14px] bg-red text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px]">
              4
            </div>
          </button>

          {showNotif && (
            <div className="absolute top-10 right-0 w-80 bg-surface border border-border rounded-[var(--radius)] shadow-lg z-[200]">
              <div className="px-3 py-2.5 text-[11px] font-bold border-b border-border flex justify-between">
                <span>Notifications</span>
                <span className="text-primary cursor-pointer font-medium text-[10px]">
                  Tout marquer lu
                </span>
              </div>
              {notifications.map((n, i) => (
                <div
                  key={i}
                  className="px-3 py-2.5 border-b border-border-light text-xs cursor-pointer hover:bg-bg last:border-b-0"
                >
                  <div className="font-medium mb-[1px] flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: n.color }}
                    />
                    {n.title}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {n.time} &bull; {n.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button>Exporter</Button>
        <Button variant="primary">+ Nouvelle mission</Button>
      </div>
    </div>
  );
}
