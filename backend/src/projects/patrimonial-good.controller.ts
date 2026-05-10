import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt.strategy";
import { PatrimonialGoodService } from "./patrimonial-good.service";
import {
  CreatePatrimonialGoodDto,
  UpdatePatrimonialGoodDto,
} from "./dto/patrimonial-good.dto";
import { UsersService } from "../users/users.service";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class PatrimonialGoodController {
  constructor(
    private patrimonialService: PatrimonialGoodService,
    private usersService: UsersService,
  ) {}

  /**
   * GET /projects/:projectId/patrimonial-goods
   * Get all patrimonial goods for project
   */
  @Get(":projectId/patrimonial-goods")
  async getAll(@Param("projectId") projectId: string) {
    return this.patrimonialService.getByProject(projectId);
  }

  /**
   * GET /projects/:projectId/patrimonial-goods/:id
   * Get single patrimonial good
   */
  @Get(":projectId/patrimonial-goods/:id")
  async getById(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
  ) {
    return this.patrimonialService.getById(id);
  }

  /**
   * POST /projects/:projectId/patrimonial-goods
   * Create new patrimonial good
   */
  @Post(":projectId/patrimonial-goods")
  async create(
    @Param("projectId") projectId: string,
    @Body() payload: CreatePatrimonialGoodDto,
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.patrimonialService.create(projectId, payload, actor);
  }

  /**
   * PUT /projects/:projectId/patrimonial-goods/:id
   * Update patrimonial good
   */
  @Put(":projectId/patrimonial-goods/:id")
  async update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() payload: UpdatePatrimonialGoodDto,
    @CurrentUser() user: JwtPayload | null,
  ) {
    let actor = null;
    if (user?.sub) {
      actor = await this.usersService.findByAnyId(user.sub);
    }

    return this.patrimonialService.update(id, payload, actor);
  }

  /**
   * DELETE /projects/:projectId/patrimonial-goods/:id
   * Delete patrimonial good
   */
  @Delete(":projectId/patrimonial-goods/:id")
  async delete(@Param("projectId") projectId: string, @Param("id") id: string) {
    await this.patrimonialService.delete(id);
    return { success: true };
  }

  /**
   * POST /projects/:projectId/patrimonial-goods/:id/attachment
   * Add attachment to patrimonial good
   */
  @Post(":id/attachment")
  async addAttachment(
    @Param("id") id: string,
    @Body() body: { attachmentType: string; s3Key: string },
  ) {
    return this.patrimonialService.addAttachment(
      id,
      body.attachmentType,
      body.s3Key,
    );
  }
}
