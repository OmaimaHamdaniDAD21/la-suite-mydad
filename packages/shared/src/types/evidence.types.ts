export type EvidenceStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "VALIDATED" | "REJECTED" | "EXPIRED";
export type EvidenceType = "DOCUMENT" | "DATA_EXTRACT" | "SCREENSHOT" | "CERTIFICATE" | "DECLARATION" | "PHOTO" | "LINK";

export interface Evidence {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: EvidenceType;
  category: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  externalUrl: string | null;
  requirementIds: string[] | null;
  actionIds: string[] | null;
  status: EvidenceStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

export interface CreateEvidenceRequest {
  title: string;
  description?: string;
  type: EvidenceType;
  category: string;
  requirementIds?: string[];
  actionIds?: string[];
  externalUrl?: string;
  validFrom?: string;
  validUntil?: string;
}

export interface ReviewEvidenceRequest {
  status: "VALIDATED" | "REJECTED";
  reviewNote?: string;
  rejectionReason?: string;
}
