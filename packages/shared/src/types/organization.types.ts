import type { Role } from "./auth.types";

export type OrganizationType = "CABINET" | "ENTREPRISE";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  siret: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  logoUrl: string | null;
  isActive: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  joinedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  type: OrganizationType;
  siret?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  siret?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  logoUrl?: string;
}
