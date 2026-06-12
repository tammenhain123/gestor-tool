import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Project, ProjectType } from "./project.entity";
import { Qualification } from "./qualification.entity";
import { Capacity } from "./capacity.entity";
import { Strategy } from "./strategy.entity";
import { BankEntry } from "./bank-entry.entity";
import { Asset } from "./asset.entity";
import { FinancialDoc } from "./financial-doc.entity";
import { Indicator } from "./indicator.entity";
import { Requirement } from "./requirement.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { User } from "../users/user.entity";
import { Company } from "../company/company.entity";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  constructor(
    @InjectRepository(Project) private readonly repo: Repository<Project>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Qualification)
    private readonly qualRepo: Repository<Qualification>,
    @InjectRepository(Capacity)
    private readonly capacityRepo: Repository<Capacity>,
    @InjectRepository(Strategy)
    private readonly strategyRepo: Repository<Strategy>,
    @InjectRepository(BankEntry)
    private readonly bankRepo: Repository<BankEntry>,
    @InjectRepository(Asset) private readonly assetRepo: Repository<Asset>,
    @InjectRepository(FinancialDoc)
    private readonly docRepo: Repository<FinancialDoc>,
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    @InjectRepository(Requirement)
    private readonly requirementRepo: Repository<Requirement>,
  ) {}

  // NOTE: Encoding/repair helpers removed. The service will no longer
  // attempt automatic re-interpretation of string bytes (latin1/binary→utf8)
  // because that can corrupt already-correct UTF-8 text. If you still
  // need an offline repair for already-corrupted DB rows, run a one-off
  // migration script instead of doing runtime conversions here.

  async getQualification(projectId: string): Promise<any | null> {
    const q = await this.qualRepo.findOne({
      where: { project: { id: projectId } },
      relations: ["project"],
    });
    return q ?? null;
  }

  async saveQualification(
    projectId: string,
    payload: any,
    actor: User | null,
  ): Promise<any> {
    const project = await this.findOne(projectId);
    if (!project) throw new NotFoundException("Project not found");

    let q = await this.qualRepo.findOne({
      where: { project: { id: projectId } },
      relations: ["project"],
    });
    if (!q) {
      q = this.qualRepo.create({
        project,
        type: payload?.solicType ?? payload?.type ?? "PJ",
        data: payload,
      });
    } else {
      q.type = payload?.solicType ?? q.type;
      q.data = payload;
    }
    const saved = await this.qualRepo.save(q);

    // persist bank entries (replace existing for this qualification)
    try {
      if (Array.isArray(payload?.bankEntries)) {
        await this.bankRepo.delete({ qualificationId: saved.id });
        const entries = payload.bankEntries.map((be: any) =>
          this.bankRepo.create({
            projectId,
            qualificationId: saved.id,
            banco: be.banco || "",
            numeroConta: be.numeroConta || be.numero || null,
            agencia: be.agencia || null,
            ano: be.ano || null,
            mes: be.mes || null,
            s3Key: be.s3Key || be.key || null,
            originalName:
              be.originalName || be.name || (be.file ? be.file.name : null),
          }),
        );
        if (entries.length) await this.bankRepo.save(entries);
      }
    } catch (e) {
      // ignore persistence errors but log could be added
    }

    // persist assets (bens)
    try {
      if (Array.isArray(payload?.bens)) {
        await this.assetRepo.delete({ qualificationId: saved.id });
        const assets = payload.bens.map((b: any) =>
          this.assetRepo.create({
            projectId,
            qualificationId: saved.id,
            descricao: b.descricao || "",
            apresentacao: b.apresentacao || null,
            matricula: b.matricula || null,
            valorAtual: b.valorAtual || null,
          }),
        );
        if (assets.length) await this.assetRepo.save(assets);
      }
    } catch (e) {
      // ignore
    }

    // persist financial docs
    try {
      if (Array.isArray(payload?.docs)) {
        await this.docRepo.delete({ qualificationId: saved.id });
        const docs = payload.docs.map((d: any) => ({
          projectId,
          qualificationId: saved.id,
          label: d.label || d.name || "Documento",
          s3Key: d.s3Key || d.key || undefined,
          originalName:
            d.originalName || d.name || (d.file ? d.file.name : undefined),
          meta: d.meta ? JSON.stringify(d.meta) : undefined,
        }));
        if (docs.length)
          await this.docRepo.save(this.docRepo.create(docs as any));
      }
    } catch (e) {
      // ignore
    }

    return saved;
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.repo.find({
      relations: ["company", "creator", "users"],
    });
    return rows;
  }

  async findAllByCompany(tenantId: string): Promise<Project[]> {
    const rows = await this.repo
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.company", "company")
      .leftJoinAndSelect("project.creator", "creator")
      .leftJoinAndSelect("project.users", "users")
      .where("company.id = :tenantId", { tenantId })
      .getMany();
    return rows;
  }

  async findAllForMember(userId: string): Promise<Project[]> {
    // Return all projects belonging to the same company (tenant) as the user
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ["company"],
      });
      const tenantId = user?.company?.id ?? (user as any)?.tenantId ?? null;
      if (!tenantId) return [];
      return this.findAllByCompany(tenantId);
    } catch (e) {
      this.logger.error(`findAllForMember failed for user=${userId}: ${e}`);
      return [];
    }
  }

  async findOne(id: string): Promise<Project | null> {
    const p = await this.repo.findOne({
      where: { id },
      relations: ["company", "creator", "users"],
    });
    return p;
  }

  async getCapacity(projectId: string): Promise<any | null> {
    const cap = await this.capacityRepo.findOne({
      where: { project: { id: projectId } },
      relations: ["project"],
    });
    const capacityId = cap?.id;
    const bankEntries = await this.bankRepo.find({
      where: { projectId, capacityId },
    });
    const assets = await this.assetRepo.find({
      where: { projectId, capacityId },
    });
    const docs = await this.docRepo.find({ where: { projectId, capacityId } });
    try {
      if (Array.isArray(assets) && assets.length > 0) {
        const sample = assets[0].descricao;
        if (typeof sample === "string" && sample.length > 0) {
          try {
            const bufUtf8 = Buffer.from(sample, "utf8");
            const bufLatin1 = Buffer.from(sample, "latin1");
            this.logger.log(`Sample asset.descricao (string): ${sample}`);
            this.logger.debug(
              `asset.descricao bytes (utf8 hex prefix): ${bufUtf8.slice(0, 64).toString("hex")}`,
            );
            this.logger.debug(
              `asset.descricao bytes (latin1 hex prefix): ${bufLatin1.slice(0, 64).toString("hex")}`,
            );
            const reconverted = Buffer.from(bufLatin1).toString("utf8");
            this.logger.debug(
              `asset.descricao reconverted latin1->utf8 (string): ${reconverted}`,
            );
          } catch (e) {
            this.logger.warn(`Failed to inspect asset.descricao bytes: ${e}`);
          }
        }
      }
    } catch (e) {
      // swallow logging errors
    }
    return {
      ...(cap?.data || {}),
      bankEntries,
      bens: assets,
      docs,
    };
  }

  async getStrategy(projectId: string): Promise<any | null> {
    const s = await this.strategyRepo.findOne({
      where: { project: { id: projectId } },
      relations: ["project"],
    });
    return s ?? null;
  }

  async getIndicators(projectId: string): Promise<any | null> {
    const ind = await this.indicatorRepo.findOne({
      where: { projectId },
      relations: ["project"],
    });
    return ind?.data ?? null;
  }

  async saveIndicators(
    projectId: string,
    payload: any,
    actor: User | null,
  ): Promise<any> {
    const project = await this.findOne(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const sanitizeStrings = (v: any): any => {
      if (v === null || v === undefined) return v;
      if (typeof v === "string") return v.normalize ? v.normalize("NFC") : v;
      if (Array.isArray(v)) return v.map((x) => sanitizeStrings(x));
      if (typeof v === "object") {
        const out: any = {};
        for (const k of Object.keys(v)) out[k] = sanitizeStrings((v as any)[k]);
        return out;
      }
      return v;
    };

    const sanitizedPayload = sanitizeStrings(payload);

    try {
      let ind = await this.indicatorRepo.findOne({
        where: { projectId },
        relations: ["project"],
      });
      if (!ind) {
        ind = this.indicatorRepo.create({
          projectId,
          project,
          data: sanitizedPayload,
        });
      } else {
        ind.data = sanitizedPayload;
      }

      const saved = await this.indicatorRepo.save(ind);
      return saved.data ?? null;
    } catch (e) {
      this.logger.error(`saveIndicators failed for project=${projectId}: ${e}`);
      throw e;
    }
  }

  async getRequirements(projectId: string): Promise<any | null> {
    const req = await this.requirementRepo.findOne({
      where: { projectId },
      relations: ["project"],
    });
    return req?.data ?? null;
  }

  async saveRequirements(
    projectId: string,
    payload: any,
    actor: User | null,
  ): Promise<any> {
    const project = await this.findOne(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const sanitizeStrings = (v: any): any => {
      if (v === null || v === undefined) return v;
      if (typeof v === "string") return v.normalize ? v.normalize("NFC") : v;
      if (Array.isArray(v)) return v.map((x) => sanitizeStrings(x));
      if (typeof v === "object") {
        const out: any = {};
        for (const k of Object.keys(v)) out[k] = sanitizeStrings((v as any)[k]);
        return out;
      }
      return v;
    };

    const sanitizedPayload = sanitizeStrings(payload);

    try {
      let req = await this.requirementRepo.findOne({
        where: { projectId },
        relations: ["project"],
      });

      if (!req) {
        req = this.requirementRepo.create({
          projectId,
          project,
          data: sanitizedPayload,
        });
      } else {
        req.data = sanitizedPayload;
      }

      const saved = await this.requirementRepo.save(req);
      return saved.data ?? null;
    } catch (e) {
      this.logger.error(
        `saveRequirements failed for project=${projectId}: ${e}`,
      );
      throw e;
    }
  }

  async saveStrategy(
    projectId: string,
    payload: any,
    actor: User | null,
  ): Promise<any> {
    const project = await this.findOne(projectId);
    if (!project) throw new NotFoundException("Project not found");

    let s = await this.strategyRepo.findOne({
      where: { project: { id: projectId } },
      relations: ["project"],
    });
    // sanitize payload strings to avoid invalid-UTF8 byte sequences and
    // preserve accent characters in a normalized form
    const sanitizeStrings = (v: any): any => {
      if (v === null || v === undefined) return v;
      if (typeof v === "string") return v.normalize ? v.normalize("NFC") : v;
      if (Array.isArray(v)) return v.map((x) => sanitizeStrings(x));
      if (typeof v === "object") {
        const out: any = {};
        for (const k of Object.keys(v)) out[k] = sanitizeStrings((v as any)[k]);
        return out;
      }
      return v;
    };

    const sanitized = sanitizeStrings(payload);

    if (!s) {
      s = this.strategyRepo.create({ project, data: sanitized });
    } else {
      s.data = sanitized;
    }

    const saved = await this.strategyRepo.save(s);
    return saved;
  }

  async saveCapacity(
    projectId: string,
    payload: any,
    actor: User | null,
  ): Promise<any> {
    const project = await this.findOne(projectId);
    if (!project) throw new NotFoundException("Project not found");
    const sanitizeStrings = (v: any): any => {
      if (v === null || v === undefined) return v;
      if (typeof v === "string") return v.normalize ? v.normalize("NFC") : v;
      if (Array.isArray(v)) return v.map((x) => sanitizeStrings(x));
      if (typeof v === "object") {
        const out: any = {};
        for (const k of Object.keys(v)) out[k] = sanitizeStrings((v as any)[k]);
        return out;
      }
      return v;
    };

    // sanitize payload strings to avoid potential invalid-UTF8 byte sequences
    const sanitizedPayload = sanitizeStrings(payload);

    let cap = await this.capacityRepo.findOne({
      where: { project: { id: projectId } },
      relations: ["project"],
    });
    if (!cap) {
      cap = this.capacityRepo.create({ project, data: sanitizedPayload });
    } else {
      cap.data = sanitizedPayload;
    }
    // log payload summary for debugging encoding errors
    try {
      const asJson = JSON.stringify(cap.data);
      this.logger.log(
        `Saving capacity for project=${projectId} size=${asJson.length}`,
      );
      // inspect first bytes if we suspect encoding issues
      const buf = Buffer.from(asJson, "utf8");
      this.logger.debug(
        `payload hex prefix: ${buf.slice(0, 32).toString("hex")}`,
      );
    } catch (e) {
      this.logger.error(
        `Failed to stringify capacity payload before save: ${e}`,
      );
    }

    let saved;
    try {
      saved = await this.capacityRepo.save(cap);
    } catch (e) {
      this.logger.error(
        `capacityRepo.save failed for project=${projectId}: ${e}`,
      );
      // Do not attempt automatic latin1->utf8 conversion here; it can corrupt
      // correctly encoded text. Surface the error so callers can inspect payloads.
      throw e;
    }

    const capacityId = saved.id;

    // persist bank entries (replace existing for this capacity)
    try {
      if (Array.isArray(sanitizedPayload?.bankEntries)) {
        await this.bankRepo.delete({ capacityId });
        const entries = sanitizedPayload.bankEntries.map((be: any) =>
          this.bankRepo.create({
            projectId,
            capacityId,
            banco: be.banco || "",
            numeroConta: be.numeroConta || be.numero || null,
            agencia: be.agencia || null,
            ano: be.ano || null,
            mes: be.mes || null,
            s3Key: be.s3Key || be.key || null,
            originalName:
              be.originalName || be.name || (be.file ? be.file.name : null),
          }),
        );
        if (entries.length) {
          const savedEntries = await this.bankRepo.save(entries);
          this.logger.log(
            `Saved ${savedEntries.length} bankEntries for capacity=${capacityId}`,
          );
        }
      }
    } catch (e) {}

    // persist assets
    try {
      if (Array.isArray(sanitizedPayload?.bens)) {
        await this.assetRepo.delete({ capacityId });
        const assets = sanitizedPayload.bens.map((b: any) =>
          this.assetRepo.create({
            projectId,
            capacityId,
            descricao: b.descricao || "",
            apresentacao: b.apresentacao || null,
            matricula: b.matricula || null,
            valorAtual: b.valorAtual || null,
          }),
        );
        if (assets.length) {
          const savedAssets = await this.assetRepo.save(assets);
          this.logger.log(
            `Saved ${savedAssets.length} assets for capacity=${capacityId}`,
          );
        }
      }
    } catch (e) {}

    // persist docs
    try {
      if (Array.isArray(sanitizedPayload?.docs)) {
        await this.docRepo.delete({ capacityId });
        const docs = sanitizedPayload.docs.map((d: any) => ({
          projectId,
          capacityId,
          label: d.label || d.name || "Documento",
          s3Key: d.s3Key || d.key || undefined,
          originalName:
            d.originalName || d.name || (d.file ? d.file.name : undefined),
          meta: d.meta ? JSON.stringify(d.meta) : undefined,
        }));
        if (docs.length) {
          const createdDocs = await this.docRepo.save(
            this.docRepo.create(docs as any),
          );
          this.logger.log(
            `Saved ${createdDocs.length} docs for capacity=${capacityId}`,
          );
        }
      }
    } catch (e) {
      this.logger.error(
        `Failed to persist docs for capacity=${capacityId}: ${e}`,
      );
    }

    return saved;
  }

  async create(dto: CreateProjectDto, creator: User): Promise<Project> {
    // Derive company id from creator relation or tenantId field
    const tenantId =
      creator.company?.id ||
      (creator as any).tenantId ||
      (creator as any).tenant_id ||
      null;
    if (!tenantId) throw new BadRequestException("Creator has no company");

    const company = await this.companyRepo.findOne({ where: { id: tenantId } });
    if (!company) throw new BadRequestException("Company not found");

    const project = this.repo.create({
      name: dto.name,
      imageUrl: dto.imageUrl ?? null,
      type: dto.type,
      description: dto.description ?? null,
      company,
      creator,
    });

    if (dto.userIds && dto.userIds.length > 0) {
      const users = await this.userRepo.find({
        where: { id: In(dto.userIds) },
      });
      project.users = users;
    }

    // sanitize string fields (normalize only). Do not perform automatic
    // latin1->utf8 conversions that reinterpret bytes.
    const sanitizeStrings = (v: any): any => {
      if (v === null || v === undefined) return v;
      if (typeof v === "string") return v.normalize ? v.normalize("NFC") : v;
      if (Array.isArray(v)) return v.map((x) => sanitizeStrings(x));
      if (typeof v === "object") {
        const out: any = {};
        for (const k of Object.keys(v)) out[k] = sanitizeStrings((v as any)[k]);
        return out;
      }
      return v;
    };

    project.name = sanitizeStrings(project.name);
    project.description = sanitizeStrings(project.description);
    project.imageUrl = sanitizeStrings(project.imageUrl);

    // Save and surface any encoding-related errors without attempting
    // automated byte-reinterpretation.
    return await this.repo.save(project);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    actor: User,
  ): Promise<Project> {
    const project = await this.findOne(id);
    if (!project) throw new NotFoundException("Project not found");

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.imageUrl !== undefined) project.imageUrl = dto.imageUrl;
    if (dto.type !== undefined) project.type = dto.type as ProjectType;
    if (dto.description !== undefined) project.description = dto.description;

    if (dto.userIds !== undefined) {
      const users = await this.userRepo.find({
        where: { id: In(dto.userIds) },
      });
      project.users = users;
    }

    // sanitize before saving to avoid invalid UTF-8 sequences
    const sanitizeStrings = (v: any): any => {
      if (v === null || v === undefined) return v;
      if (typeof v === "string") return v.normalize ? v.normalize("NFC") : v;
      if (Array.isArray(v)) return v.map((x) => sanitizeStrings(x));
      if (typeof v === "object") {
        const out: any = {};
        for (const k of Object.keys(v)) out[k] = sanitizeStrings((v as any)[k]);
        return out;
      }
      return v;
    };

    project.name = sanitizeStrings(project.name);
    project.description = sanitizeStrings(project.description);
    project.imageUrl = sanitizeStrings(project.imageUrl);

    return await this.repo.save(project);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
