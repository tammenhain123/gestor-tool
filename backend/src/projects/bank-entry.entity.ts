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

export enum BankStatementStatus {
  VALIDADO = "VALIDADO",
  NAO_VALIDADO = "NAO_VALIDADO",
  PENDENTE = "PENDENTE",
}

@Entity("bank_entries")
export class BankEntry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, { nullable: true, onDelete: "CASCADE" })
  project?: Project;

  @Column({ nullable: true })
  qualificationId?: string;

  @Column({ nullable: true })
  capacityId?: string;

  @Column()
  banco!: string;

  @Column({ nullable: true })
  numeroConta?: string;

  @Column({ nullable: true })
  agencia?: string;

  @Column({ nullable: true })
  ano?: string;

  @Column({ nullable: true })
  mes?: string;

  @Column({ nullable: true })
  s3Key?: string;

  @Column({ nullable: true })
  originalName?: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ nullable: true })
  size?: number;

  // Validação e Compliance
  @Column({ type: "enum", enum: BankStatementStatus, nullable: true })
  status?: BankStatementStatus;

  @Column({ nullable: true })
  validationDate?: string;

  @Column({ nullable: true })
  validatorId?: string;

  @Column({ nullable: true })
  validatorName?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  validator?: User;

  @Column({ nullable: true })
  uploadedByUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  uploadedBy?: User;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt!: Date;
}
