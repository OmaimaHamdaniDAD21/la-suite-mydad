"use client";

import { apiClient } from "./api-client";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  currentMembership: {
    organizationId: string;
    organizationName: string;
    organizationType: string;
    role: string;
  };
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    organizationType: string;
    role: string;
    isDefault: boolean;
  }>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

const TOKEN_KEY = "mydad_access_token";
const REFRESH_KEY = "mydad_refresh_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  apiClient.setToken(tokens.accessToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  apiClient.setToken(null);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", { email, password });
  storeTokens(res.tokens);
  return res;
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: "CABINET" | "ENTREPRISE";
}): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/register", data);
  storeTokens(res.tokens);
  return res;
}

export async function getMe(): Promise<User> {
  const token = getStoredToken();
  if (token) apiClient.setToken(token);
  return apiClient.get<User>("/auth/me");
}

export async function logout() {
  try {
    await apiClient.post("/auth/logout");
  } catch {
    // ignore
  }
  clearTokens();
}
