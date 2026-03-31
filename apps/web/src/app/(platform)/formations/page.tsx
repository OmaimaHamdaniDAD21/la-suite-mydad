"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { val: "1", label: "En cours" },
  { val: "3", label: "Terminees", color: "var(--green)" },
  { val: "14h", label: "Heures" },
  { val: "1", label: "Certificat" },
];

const learnings = [
  { title: "Economie circulaire & dechets", desc: "5H \u2022 0%", status: "start" },
  { title: "Bases de la durabilite", desc: "3H", status: "done" },
  { title: "Cadre reglementaire RSE", desc: "4H", status: "done-no-cert" },
];

const sessions = [
  { date: "30\nmars", title: "Economie circulaire", desc: "Visio 14h00", upcoming: true },
  { date: "30\nmars", title: "Bien-etre au travail", desc: "Visio 16h00", upcoming: true },
  { date: "15\navr.", title: "Biodiversite et ecosystemes", desc: "Visio 10h00", upcoming: false },
];

export default function FormationsPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">Formations</div>
          <div className="text-xs text-text-secondary mt-0.5">Competences durabilite</div>
        </div>
        <div className="flex gap-1.5">
          <Button>Catalogue complet</Button>
          <Button variant="primary">+ S&apos;inscrire</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border-b border-border">
        {["Dashboard", "Catalogue", "Mes Formations", "Atlas RSE", "Competences"].map((tab, i) => (
          <div key={tab} className={`px-3.5 py-2 text-xs font-medium cursor-pointer border-b-2 -mb-[1px] ${i === 0 ? "text-text border-text font-semibold" : "text-text-muted border-transparent hover:text-text"}`}>
            {tab}
          </div>
        ))}
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

      <div className="grid grid-cols-2 gap-3.5">
        {/* MyDAD Learning */}
        <Card>
          <CardHeader>
            <CardTitle>MyDAD Learning</CardTitle>
            <Button size="sm">Voir tout</Button>
          </CardHeader>
          <CardBody>
            {learnings.map((l, i) => (
              <div key={i} className="py-2 border-b border-border-light last:border-b-0 flex items-center gap-2.5">
                {l.status === "start" ? (
                  <div className="w-6 h-6 rounded-full bg-primary-bg text-primary border-[1.5px] border-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">&#9654;</div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">&#10003;</div>
                )}
                <div className="flex-1">
                  <div className="text-xs font-semibold">{l.title}</div>
                  <div className="text-[11px] text-text-secondary">{l.desc}</div>
                </div>
                {l.status === "start" && <Button size="sm" variant="primary">Commencer</Button>}
                {l.status === "done" && (
                  <div className="flex gap-1">
                    <Badge color="green">Termine</Badge>
                    <Button size="sm" variant="ghost">Certificat</Button>
                  </div>
                )}
                {l.status === "done-no-cert" && <Badge color="green">Termine</Badge>}
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Sessions HOSMONY */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions HOSMONY</CardTitle>
            <Button size="sm">Planifier</Button>
          </CardHeader>
          <CardBody>
            {sessions.map((s, i) => (
              <div key={i} className="py-2 border-b border-border-light last:border-b-0 flex items-center gap-2.5">
                <div
                  className="px-[5px] py-[3px] rounded text-[9px] font-bold text-center leading-tight text-white flex-shrink-0 whitespace-pre-line"
                  style={{ background: s.upcoming ? "var(--primary)" : "var(--text-secondary)" }}
                >
                  {s.date}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold">{s.title}</div>
                  <div className="text-[11px] text-text-secondary">{s.desc}</div>
                </div>
                <Button size="sm">{s.upcoming ? "Rejoindre" : "S'inscrire"}</Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
