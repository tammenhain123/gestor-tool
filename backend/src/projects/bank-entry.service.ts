import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BankEntry, BankStatementStatus } from "./bank-entry.entity";
import { Project } from "./project.entity";
import { User } from "../users/user.entity";

export class CreateBankEntryDto {
  banco!: string;
  numeroConta?: string;
  agencia?: string;
  ano?: string;
  mes?: string;
  status?: BankStatementStatus;
  validationDate?: string;
  validatorId?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export class UpdateBankEntryDto {
  banco?: string;
  numeroConta?: string;
  agencia?: string;
  ano?: string;
  mes?: string;
  status?: BankStatementStatus;
  validationDate?: string;
  validatorId?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

@Injectable()
export class BankEntryService {
  constructor(
    @InjectRepository(BankEntry)
    private bankRepo: Repository<BankEntry>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  /**
   * Get all bank entries for a project
   */
  async getByProject(projectId: string): Promise<BankEntry[]> {
    return this.bankRepo.find({
      where: { projectId },
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Get single bank entry by ID
   */
  async getById(id: string): Promise<BankEntry> {
    const entry = await this.bankRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException("Bank entry not found");
    }
    return entry;
  }

  /**
   * Create new bank entry
   */
  async create(
    projectId: string,
    payload: CreateBankEntryDto,
    actor: User | null,
  ): Promise<BankEntry> {
    // Verify project exists
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const entry = new BankEntry();
    entry.projectId = projectId;
    entry.banco = payload.banco;
    entry.numeroConta = payload.numeroConta;
    entry.agencia = payload.agencia;
    entry.ano = payload.ano;
    entry.mes = payload.mes;
    entry.status = payload.status || BankStatementStatus.PENDENTE;
    entry.validationDate = payload.validationDate;
    entry.validatorId = payload.validatorId;
    entry.originalName = payload.originalName;
    entry.mimeType = payload.mimeType;
    entry.size = payload.size;

    return await this.bankRepo.save(entry);
  }

  /**
   * Update bank entry
   */
  async update(
    id: string,
    payload: UpdateBankEntryDto,
    actor: User | null,
  ): Promise<BankEntry> {
    const entry = await this.getById(id);

    // Update fields
    if (payload.banco !== undefined) entry.banco = payload.banco;
    if (payload.numeroConta !== undefined) entry.numeroConta = payload.numeroConta;
    if (payload.agencia !== undefined) entry.agencia = payload.agencia;
    if (payload.ano !== undefined) entry.ano = payload.ano;
    if (payload.mes !== undefined) entry.mes = payload.mes;
    if (payload.status !== undefined) entry.status = payload.status;
    if (payload.validationDate !== undefined) entry.validationDate = payload.validationDate;
    if (payload.validatorId !== undefined) entry.validatorId = payload.validatorId;
    if (payload.originalName !== undefined) entry.originalName = payload.originalName;
    if (payload.mimeType !== undefined) entry.mimeType = payload.mimeType;
    if (payload.size !== undefined) entry.size = payload.size;

    return await this.bankRepo.save(entry);
  }

  /**
   * Delete bank entry
   */
  async delete(id: string): Promise<void> {
    await this.bankRepo.delete(id);
  }
}
