export interface Certidao {
  id: number;
  descricao: string;
  dataValidate: string;
  anexo: File | null;
  anexoName: string;
  anexoS3Key: string;
}

export interface Obricacao {
  id: number;
  nome: string;
  competencia: string;
  arquivo: File | null;
  anexoName: string;
  arquivoPdf: File | null;
  arquivoPdfName: string;
  comprovante: File | null;
  comprovanteName: string;
  comprovantePdf: File | null;
  comprovantePdfName: string;
}

export interface RequisitosPayload {
  certidoes: Certidao[];
  obrigacoes: Obricacao[];
}
