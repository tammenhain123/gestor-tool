import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Project } from "./project.entity";
import { User } from "../users/user.entity";

export enum ComplianceDocumentStatus {
  REQUESTED = "REQUESTED",
  VALIDATED = "VALIDATED",
  NOT_VALIDATED = "NOT_VALIDATED",
  PENDING = "PENDING",
}

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

@Entity("compliance_validations")
export class ComplianceValidation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, { nullable: false, onDelete: "CASCADE" })
  project!: Project;

  // BLOCO 1: Organograma de Cargos e Funções
  @Column({ type: "jsonb", nullable: true })
  organograms?: OrganogramDocument[];

  // BLOCO 2: Extratos Bancários (relação com BankEntry)
  // Armazenamos apenas referências; dados reais em BankEntry

  // BLOCO 3: Relatórios
  @Column({ type: "jsonb", nullable: true })
  reports?: ReportItem[];

  // Auditoria
  @Column({ type: "jsonb", nullable: true })
  auditLog?: Array<{
    timestamp: string;
    action: string;
    user: string;
    changes: any;
  }>;

  @Column({ nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  createdBy?: User;

  @Column({ nullable: true })
  lastModifiedByUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  lastModifiedBy?: User;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt!: Date;
}
