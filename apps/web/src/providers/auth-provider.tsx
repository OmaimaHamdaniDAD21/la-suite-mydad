"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, getMe, login as loginFn, register as registerFn, logout as logoutFn, getStoredToken } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; organizationName: string; organizationType: "CABINET" | "ENTREPRISE" }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginFn(email, password);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; organizationName: string; organizationType: "CABINET" | "ENTREPRISE" }) => {
    const res = await registerFn(data);
    setUser(res.user);
  };

  const logout = async () => {
    await logoutFn();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
