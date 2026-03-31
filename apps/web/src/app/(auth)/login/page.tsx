"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"CABINET" | "ENTREPRISE">("CABINET");

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          firstName,
          lastName,
          organizationName: orgName,
          organizationType: orgType,
        });
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAFA" }}>
      <div className="w-full max-w-sm">
        <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div style={{ width: 40, height: 40, background: "#2B4A8C", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>M</span>
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1A1A2E" }}>La Suite MyDAD</h1>
              <span style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                Cockpit Stratégique
              </span>
            </div>
          </div>

          <div style={{ display: "flex", background: "#F5F5F5", borderRadius: 10, padding: 3, marginBottom: 24, gap: 2 }}>
            <button
              onClick={() => setMode("login")}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, background: mode === "login" ? "#fff" : "transparent", color: mode === "login" ? "#1A1A2E" : "#9CA3AF", boxShadow: mode === "login" ? "0 1px 2px rgba(0,0,0,0.04)" : "none", border: "none", cursor: "pointer" }}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode("register")}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, background: mode === "register" ? "#fff" : "transparent", color: mode === "register" ? "#1A1A2E" : "#9CA3AF", boxShadow: mode === "register" ? "0 1px 2px rgba(0,0,0,0.04)" : "none", border: "none", cursor: "pointer" }}
            >
              Inscription
            </button>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #DC2626", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#DC2626" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Prénom</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Sophie" style={{ width: "100%", padding: "10px 12px", border: "1px solid #EBEBEB", borderRadius: 10, fontSize: 13, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Nom</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Laurent" style={{ width: "100%", padding: "10px 12px", border: "1px solid #EBEBEB", borderRadius: 10, fontSize: 13, outline: "none" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Nom de l&apos;organisation</label>
                  <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} required placeholder="Cabinet Laurent & Associés" style={{ width: "100%", padding: "10px 12px", border: "1px solid #EBEBEB", borderRadius: 10, fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Type</label>
                  <select value={orgType} onChange={e => setOrgType(e.target.value as "CABINET" | "ENTREPRISE")} style={{ width: "100%", padding: "10px 12px", border: "1px solid #EBEBEB", borderRadius: 10, fontSize: 13, outline: "none", background: "#fff" }}>
                    <option value="CABINET">Cabinet d&apos;expertise comptable</option>
                    <option value="ENTREPRISE">Entreprise</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="sophie@cabinet.fr" style={{ width: "100%", padding: "10px 12px", border: "1px solid #EBEBEB", borderRadius: 10, fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={8} style={{ width: "100%", padding: "10px 12px", border: "1px solid #EBEBEB", borderRadius: 10, fontSize: 13, outline: "none" }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0", background: loading ? "#9CA3AF" : "#2B4A8C", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          {mode === "login" && (
            <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 20 }}>
              Mot de passe oublié ?{" "}
              <span style={{ color: "#2B4A8C", cursor: "pointer", fontWeight: 600 }}>Réinitialiser</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
