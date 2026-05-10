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
import { SaveComplianceValidationDto } from "./dto/compliance-validation.dto";

@Injectable()
export class ComplianceValidationService {
  constructor(
    @InjectRepository(ComplianceValidation)
    private complianceRepo: Repository<ComplianceValidation>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  /**
   * Get compliance validation for a project
   */
  async getByProject(projectId: string): Promise<ComplianceValidation | null> {
    return this.complianceRepo.findOne({
      where: { projectId },
      relations: ["project", "createdBy", "lastModifiedBy"],
    });
  }

  /**
   * Save or update compliance validation
   */
  async saveCompliance(
    projectId: string,
    payload: SaveComplianceValidationDto,
    actor: User | null,
  ): Promise<ComplianceValidation> {
    // Verify project exists
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Find existing or create new
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
      const organograms: OrganogramDocument[] = payload.organograms.map(
        (org) => ({
          ...org,
          type: "organogram",
          isRequested: true,
          status: org.status || ComplianceDocumentStatus.PENDING,
        }),
      );
      compliance.organograms = organograms;
    }

    // Update reports
    if (payload.reports !== undefined) {
      const reports: ReportItem[] = payload.reports.map((rep) => ({
        name: rep.name || rep.type,
        ...rep,
        type: rep.type as any,
        isRequested: true,
        status: rep.status || ComplianceDocumentStatus.PENDING,
      }));
      compliance.reports = reports;
    }

    // Add audit log entry
    if (!compliance.auditLog) {
      compliance.auditLog = [];
    }
    compliance.auditLog.push({
      timestamp: new Date().toISOString(),
      action: "COMPLIANCE_UPDATED",
      user: actor?.username || "system",
      changes: payload,
    });

    compliance.lastModifiedByUserId = actor?.id;
    compliance.lastModifiedBy = actor ?? undefined;

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
