import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  PatrimonialGood,
  PatrimonialGoodData,
} from "./patrimonial-good.entity";
import { Project } from "./project.entity";
import { User } from "../users/user.entity";
import {
  CreatePatrimonialGoodDto,
  UpdatePatrimonialGoodDto,
} from "./dto/patrimonial-good.dto";

@Injectable()
export class PatrimonialGoodService {
  constructor(
    @InjectRepository(PatrimonialGood)
    private goodRepo: Repository<PatrimonialGood>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  /**
   * Get all patrimonial goods for a project
   */
  async getByProject(projectId: string): Promise<PatrimonialGood[]> {
    return this.goodRepo.find({
      where: { projectId },
      relations: ["project", "createdBy", "lastModifiedBy"],
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Get single patrimonial good by ID
   */
  async getById(id: string): Promise<PatrimonialGood> {
    const good = await this.goodRepo.findOne({
      where: { id },
      relations: ["project", "createdBy", "lastModifiedBy"],
    });
    if (!good) {
      throw new NotFoundException("Patrimonial good not found");
    }
    return good;
  }

  /**
   * Create new patrimonial good
   */
  async create(
    projectId: string,
    payload: CreatePatrimonialGoodDto,
    actor: User | null,
  ): Promise<PatrimonialGood> {
    // Verify project exists
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const data: PatrimonialGoodData = {
      presentacaoFisica: payload.presentacaoFisica,
      presentacaoHistorica: payload.presentacaoHistorica,
      currency: payload.currency,
      valorAtual: payload.valorAtual,
      valorProjetado5anos: payload.valorProjetado5anos,
      valorHistorico5anos: payload.valorHistorico5anos,
      valorNaCompra: payload.valorNaCompra,
      dataCompra: payload.dataCompra,
      dataUltimaAvaliacao: payload.dataUltimaAvaliacao,
      matricula: payload.matricula,
      ocupante: payload.ocupante,
      attachments: payload.attachments,
      createdByUserId: actor?.id,
      lastModifiedByUserId: actor?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const good = this.goodRepo.create({
      projectId,
      data,
      createdByUserId: actor?.id,
      lastModifiedByUserId: actor?.id,
    });

    return this.goodRepo.save(good);
  }

  /**
   * Update patrimonial good
   */
  async update(
    id: string,
    payload: UpdatePatrimonialGoodDto,
    actor: User | null,
  ): Promise<PatrimonialGood> {
    const good = await this.getById(id);

    const updatedData: PatrimonialGoodData = {
      ...good.data,
      presentacaoFisica:
        payload.presentacaoFisica ?? good.data.presentacaoFisica,
      presentacaoHistorica:
        payload.presentacaoHistorica ?? good.data.presentacaoHistorica,
      currency: payload.currency ?? good.data.currency,
      valorAtual: payload.valorAtual ?? good.data.valorAtual,
      valorProjetado5anos:
        payload.valorProjetado5anos ?? good.data.valorProjetado5anos,
      valorHistorico5anos:
        payload.valorHistorico5anos ?? good.data.valorHistorico5anos,
      valorNaCompra: payload.valorNaCompra ?? good.data.valorNaCompra,
      dataCompra: payload.dataCompra ?? good.data.dataCompra,
      dataUltimaAvaliacao:
        payload.dataUltimaAvaliacao ?? good.data.dataUltimaAvaliacao,
      matricula: payload.matricula ?? good.data.matricula,
      ocupante: payload.ocupante ?? good.data.ocupante,
      attachments: payload.attachments ?? good.data.attachments,
      lastModifiedByUserId: actor?.id,
      updatedAt: new Date().toISOString(),
    };

    good.data = updatedData;
    good.lastModifiedByUserId = actor?.id;
    good.lastModifiedBy = actor ?? undefined;

    return this.goodRepo.save(good);
  }

  /**
   * Delete patrimonial good
   */
  async delete(id: string): Promise<void> {
    const good = await this.getById(id);
    await this.goodRepo.remove(good);
  }

  /**
   * Add attachment to patrimonial good
   */
  async addAttachment(
    id: string,
    attachmentType: string,
    s3Key: string,
  ): Promise<PatrimonialGood> {
    const good = await this.getById(id);

    if (!good.data.attachments) {
      good.data.attachments = {};
    }

    (good.data.attachments as any)[attachmentType] = s3Key;

    return this.goodRepo.save(good);
  }
}
