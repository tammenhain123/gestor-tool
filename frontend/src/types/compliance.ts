// Compliance & Patrimonial types
export type ComplianceDocumentStatus =
  | "REQUESTED"
  | "VALIDATED"
  | "NOT_VALIDATED"
  | "PENDING";

export interface DocumentItem {
  id?: string;
  name: string;
  description?: string;
  status?: ComplianceDocumentStatus;
  validationDate?: string;
  validator?: string;
  s3Key?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedBy?: string;
  uploadDate?: string;
  isRequested: boolean;
  file?: File | null;
}

export interface OrganogramDocument extends DocumentItem {
  type: "organogram";
}

export interface ReportItem extends DocumentItem {
  type:
    | "relatorio-endividamento"
    | "relatorio-scr"
    | "relatorio-recebiveis"
    | "relatorio-estoque"
    | "relatorio-ativo"
    | "relatorio-alienacao";
}

export interface ComplianceValidation {
  id?: string;
  projectId: string;
  organograms?: OrganogramDocument[];
  reports?: ReportItem[];
  auditLog?: Array<{
    timestamp: string;
    action: string;
    user: string;
    changes: any;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// Bank Statement
export type BankStatementStatus = "VALIDADO" | "NAO_VALIDADO" | "PENDENTE";

export interface BankStatement {
  id?: string;
  projectId?: string;
  banco: string;
  numeroConta?: string;
  agencia?: string;
  ano?: string;
  mes?: string;
  s3Key?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  status?: BankStatementStatus;
  validationDate?: string;
  validator?: string;
  uploadedBy?: string;
  file?: File | null;
}

// Patrimonial Good
export type Currency = "BRL" | "USD" | "EUR";

export interface PatrimonialGoodData {
  presentacaoFisica: string;
  presentacaoHistorica?: string;
  currency: Currency;
  valorAtual?: number;
  valorProjetado5anos?: number;
  valorHistorico5anos?: number;
  valorNaCompra?: number;
  dataCompra?: string;
  dataUltimaAvaliacao?: string;
  matricula?: string;
  ocupante?: {
    cpfCnpj: string;
    telefone?: string;
  };
  attachments?: {
    apresentacaoBem?: string;
    matricula?: string;
    itr?: string;
    car?: string;
    topografia?: string;
  };
}

export interface PatrimonialGood {
  id?: string;
  projectId?: string;
  data: PatrimonialGoodData;
  createdAt?: string;
  updatedAt?: string;
}

// Form state
export interface ComplianceFormState {
  organograms: OrganogramDocument[];
  reports: ReportItem[];
  bankEntries: BankStatement[];
  patrimonialGoods: PatrimonialGood[];
}
