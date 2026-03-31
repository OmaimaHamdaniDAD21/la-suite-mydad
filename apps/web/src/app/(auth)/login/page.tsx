"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border rounded-[var(--radius)] shadow p-8">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-[var(--radius-sm)] flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">MD</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-text">La Suite MyDAD</h1>
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">
                Plateforme de performance
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sophie.laurent@cabinet.fr"
                className="w-full px-3 py-2 border border-border rounded-[var(--radius-sm)] text-xs font-medium focus:outline-none focus:border-text-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-border rounded-[var(--radius-sm)] text-xs font-medium focus:outline-none focus:border-text-muted"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-white rounded-[var(--radius-sm)] text-xs font-semibold hover:bg-primary-hover transition-colors"
            >
              Se connecter
            </button>
          </form>

          <p className="text-center text-[10px] text-text-muted mt-6">
            Mot de passe oublie ?{" "}
            <span className="text-primary cursor-pointer font-medium">
              Reinitialiser
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
