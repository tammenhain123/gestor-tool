import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt.strategy";
import { ComplianceValidationService } from "./compliance-validation.service";
import {
  SaveComplianceValidationDto,
  CreateOrganogramDto,
  CreateReportDto,
} from "./dto/compliance-validation.dto";
import { ComplianceDocumentStatus } from "./compliance-validation.entity";
import { UsersService } from "../users/users.service";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ComplianceValidationController {
  constructor(
    private complianceService: ComplianceValidationService,
    private usersService: UsersService,
  ) {}

  /**
   * GET /projects/:projectId/compliance
   * Get compliance validation for project
   */
  @Get(":projectId/compliance")
  async getCompliance(@Param("projectId") projectId: string) {
    const compliance = await this.complianceService.getByProject(projectId);
    return compliance || { projectId, organograms: [], reports: [] };
  }

  /**
   * POST /projects/:projectId/compliance
   * Save/update compliance validation
   */
  @Post(":projectId/compliance")
  async saveCompliance(
    @Param("projectId") projectId: string,
    @Body() payload: any,
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.saveCompliance(projectId, payload, actor);
  }

  /**
   * POST /projects/:projectId/compliance/organogram/upsert
   * Upsert single organogram
   */
  @Post(":projectId/compliance/organogram/upsert")
  async upsertOrganogram(
    @Param("projectId") projectId: string,
    @Body() payload: CreateOrganogramDto,
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.upsertOrganogram(projectId, payload, actor);
  }

  /**
   * DELETE /projects/:projectId/compliance/organogram/:organogramId
   * Delete single organogram
   */
  @Delete(":projectId/compliance/organogram/:organogramId")
  async deleteOrganogram(
    @Param("projectId") projectId: string,
    @Param("organogramId") organogramId: string,
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.deleteOrganogram(
      projectId,
      organogramId,
      actor,
    );
  }

  /**
   * POST /projects/:projectId/compliance/report/upsert
   * Upsert single report
   */
  @Post(":projectId/compliance/report/upsert")
  async upsertReport(
    @Param("projectId") projectId: string,
    @Body() payload: CreateReportDto,
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.upsertReport(projectId, payload, actor);
  }

  /**
   * POST /projects/:projectId/compliance/organogram
   * Add organogram document
   */
  @Post(":projectId/compliance/organogram")
  async addOrganogram(
    @Param("projectId") projectId: string,
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.addOrganogram(
      projectId,
      body.name,
      body.description || "",
      actor,
    );
  }

  /**
   * PUT /projects/:projectId/compliance/organogram/:organogramId/validate
   * Update organogram validation status
   */
  @Put(":projectId/compliance/organogram/:organogramId/validate")
  async validateOrganogram(
    @Param("projectId") projectId: string,
    @Param("organogramId") organogramId: string,
    @Body() body: { status: ComplianceDocumentStatus },
    @CurrentUser() user: JwtPayload | null,
  ) {
    if (!Object.values(ComplianceDocumentStatus).includes(body.status)) {
      throw new BadRequestException("Invalid status");
    }

    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.updateOrganogramStatus(
      projectId,
      organogramId,
      body.status,
      actor,
    );
  }

  /**
   * POST /projects/:projectId/compliance/report
   * Add report
   */
  @Post(":projectId/compliance/report")
  async addReport(
    @Param("projectId") projectId: string,
    @Body() body: { type: string; description?: string },
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.addReport(
      projectId,
      body.type,
      body.description || "",
      actor,
    );
  }

  /**
   * PUT /projects/:projectId/compliance/report/:reportId/validate
   * Update report validation status
   */
  @Put(":projectId/compliance/report/:reportId/validate")
  async validateReport(
    @Param("projectId") projectId: string,
    @Param("reportId") reportId: string,
    @Body() body: { status: ComplianceDocumentStatus },
    @CurrentUser() user: JwtPayload | null,
  ) {
    if (!Object.values(ComplianceDocumentStatus).includes(body.status)) {
      throw new BadRequestException("Invalid status");
    }

    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.complianceService.updateReportStatus(
      projectId,
      reportId,
      body.status,
      actor,
    );
  }

  /**
   * GET /projects/:projectId/compliance/audit-log
   * Get audit log
   */
  @Get("audit-log")
  async getAuditLog(@Param("projectId") projectId: string) {
    return this.complianceService.getAuditLog(projectId);
  }
}
