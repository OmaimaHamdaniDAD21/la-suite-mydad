export const ROLES = {
  EXPERT_COMPTABLE: "EXPERT_COMPTABLE",
  DIRIGEANT: "DIRIGEANT",
  COLLABORATEUR: "COLLABORATEUR",
  CONSULTANT: "CONSULTANT",
} as const;

export type RoleKey = keyof typeof ROLES;

export const ROLE_LABELS: Record<string, string> = {
  EXPERT_COMPTABLE: "Expert-Comptable",
  DIRIGEANT: "Dirigeant",
  COLLABORATEUR: "Collaborateur",
  CONSULTANT: "Consultant HOSMONY",
};

export const ROLE_HIERARCHY: Record<string, number> = {
  CONSULTANT: 4,
  EXPERT_COMPTABLE: 3,
  DIRIGEANT: 2,
  COLLABORATEUR: 1,
};
