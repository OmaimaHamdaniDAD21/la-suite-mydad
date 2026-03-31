export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: "CABINET" | "ENTREPRISE";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  currentMembership: {
    organizationId: string;
    organizationName: string;
    organizationType: "CABINET" | "ENTREPRISE";
    role: Role;
  };
  memberships: UserMembership[];
}

export interface UserMembership {
  organizationId: string;
  organizationName: string;
  organizationType: "CABINET" | "ENTREPRISE";
  role: Role;
  isDefault: boolean;
}

export type Role =
  | "EXPERT_COMPTABLE"
  | "DIRIGEANT"
  | "COLLABORATEUR"
  | "CONSULTANT";

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface InvitationRequest {
  email: string;
  role: Role;
  organizationId: string;
}

export interface AcceptInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}
