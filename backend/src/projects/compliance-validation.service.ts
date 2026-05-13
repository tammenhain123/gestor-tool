import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ComplianceValidation,
  ComplianceDocumentStatus,
  OrganogramDocument,
  ReportItem,
} from "./compliance-validation.entity";
import { Project } from "./project.entity";
import { User } from "../users/user.entity";
import {
  SaveComplianceValidationDto,
  CreateOrganogramDto,
  CreateReportDto,
} from "./dto/compliance-validation.dto";

@Injectable()
export class ComplianceValidationService {
  constructor(
    @InjectRepository(ComplianceValidation)
    private complianceRepo: Repository<ComplianceValidation>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  private mergeDefinedFields<T extends Record<string, any>>(
    current: T | undefined,
    incoming: Partial<T>,
  ): T {
    const merged: Record<string, any> = { ...(current || {}) };

    for (const [key, value] of Object.entries(incoming)) {
      if (value !== undefined) {
        merged[key] = value;
      }
    }

    return merged as T;
  }

  /**
   * Get compliance validation for a project
   */
  async getByProject(projectId: string): Promise<ComplianceValidation | null> {
    return this.complianceRepo.findOne({
      where: { projectId },
      relations: ["project", "createdBy", "lastModifiedBy"],
    });
  }

  private async getOrCreateCompliance(
    projectId: string,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    let compliance = await this.complianceRepo.findOne({
      where: { projectId },
    });
    if (!compliance) {
      compliance = this.complianceRepo.create({
        projectId,
        createdByUserId: actor?.id,
        lastModifiedByUserId: actor?.id,
        auditLog: [],
        organograms: [],
        reports: [],
      });
      compliance = await this.complianceRepo.save(compliance);
    }

    return compliance;
  }

  /**
   * Save or update compliance validation
   */
  async saveCompliance(
    projectId: string,
    payload: SaveComplianceValidationDto | any,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    let compliance = await this.complianceRepo.findOne({
      where: { projectId },
    });
    if (!compliance) {
      compliance = this.complianceRepo.create({
        projectId,
        createdByUserId: actor?.id,
        lastModifiedByUserId: actor?.id,
        auditLog: [],
      });
    }

    // Update organograms
    if (payload.organograms !== undefined) {
      const currentOrganogramsById = new Map(
        (compliance.organograms || [])
          .filter((org) => org.id)
          .map((org) => [org.id as string, org]),
      );
      compliance.organograms = payload.organograms.map((org: any) => {
        const current = org.id ? currentOrganogramsById.get(org.id) : undefined;
        return this.mergeDefinedFields<OrganogramDocument>(current, {
          ...org,
          id: org.id || current?.id || crypto.randomUUID(),
          name: org.name || current?.name || "Organograma",
          type: "organogram",
          isRequested: true,
          status:
            org.status || current?.status || ComplianceDocumentStatus.PENDING,
          validationDate: org.validationDate ?? current?.validationDate,
          validator: org.validator ?? current?.validator,
        });
      });
    }

    // Update reports
    if (payload.reports !== undefined) {
      const currentReportsById = new Map(
        (compliance.reports || [])
          .filter((rep) => rep.id)
          .map((rep) => [rep.id as string, rep]),
      );
      compliance.reports = payload.reports.map((rep: any) => {
        const current = rep.id ? currentReportsById.get(rep.id) : undefined;
        return this.mergeDefinedFields<ReportItem>(current, {
          id: rep.id || current?.id || crypto.randomUUID(),
          name: rep.name || rep.type,
          ...rep,
          type: rep.type as any,
          isRequested: true,
          status:
            rep.status || current?.status || ComplianceDocumentStatus.PENDING,
          validationDate: rep.validationDate ?? current?.validationDate,
          validator: rep.validator ?? current?.validator,
        });
      });
    }

    // Audit log
    if (!compliance.auditLog) compliance.auditLog = [];
    compliance.auditLog.push({
      timestamp: new Date().toISOString(),
      action: "COMPLIANCE_UPDATED",
      user: actor?.username || "system",
      changes: payload,
    });

    compliance.lastModifiedByUserId = actor?.id;
    compliance.lastModifiedBy = actor ?? undefined;

    // Força TypeORM a detectar mudança no jsonb
    compliance.organograms = JSON.parse(JSON.stringify(compliance.organograms));
    compliance.reports = JSON.parse(JSON.stringify(compliance.reports));

    await this.complianceRepo.update(
      { projectId },
      {
        organograms: compliance.organograms,
        reports: compliance.reports,
        auditLog: compliance.auditLog,
        lastModifiedByUserId: compliance.lastModifiedByUserId,
      },
    );

    const reloaded = await this.complianceRepo.findOne({
      where: { projectId },
    });
    return reloaded as ComplianceValidation;
  }

  async upsertOrganogram(
    projectId: string,
    payload: CreateOrganogramDto,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    const compliance = await this.getOrCreateCompliance(projectId, actor);

    const organograms = [...(compliance.organograms || [])];
    const idx = payload.id
      ? organograms.findIndex((item) => item.id === payload.id)
      : -1;

    const current = idx >= 0 ? organograms[idx] : undefined;
    const next = this.mergeDefinedFields<OrganogramDocument>(current, {
      ...payload,
      id: payload.id || current?.id || crypto.randomUUID(),
      type: "organogram",
      isRequested: payload.isRequested ?? current?.isRequested ?? false,
      name: payload.name || current?.name || "Organograma",
      status:
        payload.status || current?.status || ComplianceDocumentStatus.PENDING,
      validationDate: payload.validationDate ?? current?.validationDate,
      validator: payload.validator ?? current?.validator,
    });

    if (idx >= 0) {
      organograms[idx] = next;
    } else {
      organograms.push(next);
    }

    compliance.organograms = JSON.parse(JSON.stringify(organograms));
    compliance.lastModifiedByUserId = actor?.id;
    compliance.auditLog = [
      ...(compliance.auditLog || []),
      {
        timestamp: new Date().toISOString(),
        action: "ORGANOGRAM_UPSERT",
        user: actor?.username || "system",
        changes: payload,
      },
    ];

    return this.complianceRepo.save(compliance);
  }

  async upsertReport(
    projectId: string,
    payload: CreateReportDto,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    const compliance = await this.getOrCreateCompliance(projectId, actor);

    const reports = [...(compliance.reports || [])];
    const idx = payload.id
      ? reports.findIndex((item) => item.id === payload.id)
      : reports.findIndex((item) => item.type === payload.type);

    const current = idx >= 0 ? reports[idx] : undefined;
    const next = this.mergeDefinedFields<ReportItem>(current, {
      ...payload,
      id: payload.id || current?.id || crypto.randomUUID(),
      name: payload.name || current?.name || payload.type,
      type: payload.type as any,
      isRequested: payload.isRequested ?? current?.isRequested ?? false,
      status:
        payload.status || current?.status || ComplianceDocumentStatus.PENDING,
      validationDate: payload.validationDate ?? current?.validationDate,
      validator: payload.validator ?? current?.validator,
    });

    if (idx >= 0) {
      reports[idx] = next;
    } else {
      reports.push(next);
    }

    compliance.reports = JSON.parse(JSON.stringify(reports));
    compliance.lastModifiedByUserId = actor?.id;
    compliance.auditLog = [
      ...(compliance.auditLog || []),
      {
        timestamp: new Date().toISOString(),
        action: "REPORT_UPSERT",
        user: actor?.username || "system",
        changes: payload,
      },
    ];

    return this.complianceRepo.save(compliance);
  }

  async deleteOrganogram(
    projectId: string,
    organogramId: string,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    const compliance = await this.getOrCreateCompliance(projectId, actor);

    compliance.organograms = (compliance.organograms || []).filter(
      (item) => item.id !== organogramId,
    );
    compliance.lastModifiedByUserId = actor?.id;
    compliance.auditLog = [
      ...(compliance.auditLog || []),
      {
        timestamp: new Date().toISOString(),
        action: "ORGANOGRAM_DELETE",
        user: actor?.username || "system",
        changes: { organogramId },
      },
    ];

    return this.complianceRepo.save(compliance);
  }

  /**
   * Add organogram document
   */
  async addOrganogram(
    projectId: string,
    name: string,
    description: string,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    let compliance = await this.complianceRepo.findOne({
      where: { projectId },
    });
    if (!compliance) {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
      });
      if (!project) throw new NotFoundException("Project not found");

      compliance = this.complianceRepo.create({
        projectId,
        createdByUserId: actor?.id,
        lastModifiedByUserId: actor?.id,
      });
    }

    if (!compliance.organograms) {
      compliance.organograms = [];
    }

    const newOrganogram: OrganogramDocument = {
      id: crypto.getRandomValues(new Uint8Array(16)).toString(),
      name,
      description,
      type: "organogram",
      isRequested: false,
      status: ComplianceDocumentStatus.PENDING,
    };

    compliance.organograms.push(newOrganogram);
    compliance.lastModifiedByUserId = actor?.id;

    return this.complianceRepo.save(compliance);
  }

  /**
   * Update organogram validation status
   */
  async updateOrganogramStatus(
    projectId: string,
    organogramId: string,
    status: ComplianceDocumentStatus,
    validator: User | null,
  ): Promise<ComplianceValidation> {
    const compliance = await this.complianceRepo.findOne({
      where: { projectId },
    });
    if (!compliance) {
      throw new NotFoundException("Compliance validation not found");
    }

    if (!compliance.organograms) {
      throw new BadRequestException("No organograms found");
    }

    const organogram = compliance.organograms.find(
      (o) => o.id === organogramId,
    );
    if (!organogram) {
      throw new NotFoundException("Organogram not found");
    }

    organogram.status = status;
    organogram.validationDate = new Date().toISOString();
    organogram.validator = validator?.username || undefined;

    // Add audit log
    if (!compliance.auditLog) {
      compliance.auditLog = [];
    }
    compliance.auditLog.push({
      timestamp: new Date().toISOString(),
      action: "ORGANOGRAM_VALIDATED",
      user: validator?.username || "system",
      changes: { organogramId, status },
    });

    compliance.lastModifiedByUserId = validator?.id;

    return this.complianceRepo.save(compliance);
  }

  /**
   * Add or update report
   */
  async addReport(
    projectId: string,
    type: string,
    description: string,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    let compliance = await this.complianceRepo.findOne({
      where: { projectId },
    });
    if (!compliance) {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
      });
      if (!project) throw new NotFoundException("Project not found");

      compliance = this.complianceRepo.create({
        projectId,
        createdByUserId: actor?.id,
      });
    }

    if (!compliance.reports) {
      compliance.reports = [];
    }

    const newReport: ReportItem = {
      id: crypto.getRandomValues(new Uint8Array(16)).toString(),
      name: type,
      description,
      type: type as any,
      isRequested: false,
      status: ComplianceDocumentStatus.PENDING,
    };

    compliance.reports.push(newReport);
    compliance.lastModifiedByUserId = actor?.id;

    return this.complianceRepo.save(compliance);
  }

  /**
   * Update report validation status
   */
  async updateReportStatus(
    projectId: string,
    reportId: string,
    status: ComplianceDocumentStatus,
    validator: User | null,
  ): Promise<ComplianceValidation> {
    const compliance = await this.complianceRepo.findOne({
      where: { projectId },
    });
    if (!compliance) {
      throw new NotFoundException("Compliance validation not found");
    }

    if (!compliance.reports) {
      throw new BadRequestException("No reports found");
    }

    const report = compliance.reports.find((r) => r.id === reportId);
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    report.status = status;
    report.validationDate = new Date().toISOString();
    report.validator = validator?.username || undefined;

    compliance.lastModifiedByUserId = validator?.id;

    return this.complianceRepo.save(compliance);
  }

  /**
   * Get audit log for compliance
   */
  async getAuditLog(projectId: string) {
    const compliance = await this.complianceRepo.findOne({
      where: { projectId },
    });
    if (!compliance) {
      return [];
    }
    return compliance.auditLog || [];
  }
}
