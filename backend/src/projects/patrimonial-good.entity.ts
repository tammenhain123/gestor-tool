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

export enum Currency {
  BRL = "BRL",
  USD = "USD",
  EUR = "EUR",
}

export interface PatrimonialGoodData {
  // Descrição
  presentacaoFisica: string; // Apresentação Física do Bem
  presentacaoHistorica?: string; // Apresentação Histórica do Bem

  // Moedas e valores
  currency: Currency;
  valorAtual?: number;
  valorProjetado5anos?: number;
  valorHistorico5anos?: number;
  valorNaCompra?: number;

  // Datas
  dataCompra?: string;
  dataUltimaAvaliacao?: string;

  // Matrícula
  matricula?: string;

  // Ocupante
  ocupante?: {
    cpfCnpj: string;
    telefone?: string;
  };

  // Anexos
  attachments?: {
    apresentacaoBem?: string; // S3 key
    matricula?: string; // S3 key
    itr?: string; // S3 key
    car?: string; // S3 key
    topografia?: string; // S3 key
  };

  // Auditoria
  createdByUserId?: string;
  lastModifiedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Entity("patrimonial_goods")
export class PatrimonialGood {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, { nullable: false, onDelete: "CASCADE" })
  project!: Project;

  // Dados estruturados do bem
  @Column({ type: "jsonb" })
  data!: PatrimonialGoodData;

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
