export const HOSMONY_LEVELS = [
  {
    level: 1,
    name: "Essentiel",
    description: "Prise de conscience et premiers pas vers la durabilité",
    minScore: 0,
    color: "#94A3B8",
    iconName: "seed",
  },
  {
    level: 2,
    name: "Dynamique",
    description: "Structuration de la démarche et formalisation de la stratégie",
    minScore: 20,
    color: "#3B82F6",
    iconName: "sprout",
  },
  {
    level: 3,
    name: "Performance",
    description: "Exécution maîtrisée et mobilisation des équipes",
    minScore: 40,
    color: "#10B981",
    iconName: "tree",
  },
  {
    level: 4,
    name: "Excellence",
    description: "Double matérialité, crédibilité marché et label externe",
    minScore: 65,
    color: "#F59E0B",
    iconName: "award",
  },
  {
    level: 5,
    name: "Étoile",
    description: "Avantage concurrentiel, actifs hosmoniques et marketplace",
    minScore: 85,
    color: "#8B5CF6",
    iconName: "star",
  },
] as const;

export type HosmonyLevelNumber = 1 | 2 | 3 | 4 | 5;
