export const CONNECTOR_TYPES = [
  {
    code: "csv_import",
    name: "Import CSV/Excel",
    description: "Import de fichiers CSV ou Excel",
    category: "file",
  },
  {
    code: "accounting_fec",
    name: "FEC (Fichier des Écritures Comptables)",
    description: "Import du fichier FEC normalisé",
    category: "accounting",
  },
  {
    code: "accounting_api",
    name: "Logiciel Comptable (API)",
    description: "Connexion API vers logiciel comptable",
    category: "accounting",
  },
  {
    code: "erp_api",
    name: "ERP (API)",
    description: "Connexion vers ERP (SAP, Sage, etc.)",
    category: "erp",
  },
  {
    code: "hr_api",
    name: "SIRH (API)",
    description: "Connexion vers système RH",
    category: "hr",
  },
  {
    code: "crm_api",
    name: "CRM (API)",
    description: "Connexion vers CRM (Salesforce, HubSpot, etc.)",
    category: "crm",
  },
  {
    code: "esg_api",
    name: "Outil ESG (API)",
    description: "Connexion vers outil de reporting ESG",
    category: "esg",
  },
  {
    code: "webhook",
    name: "Webhook",
    description: "Réception de données via webhook",
    category: "generic",
  },
  {
    code: "rest_api",
    name: "API REST générique",
    description: "Connexion à une API REST quelconque",
    category: "generic",
  },
] as const;

export type ConnectorCode = (typeof CONNECTOR_TYPES)[number]["code"];
