import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { BankEntryService, CreateBankEntryDto, UpdateBankEntryDto } from "./bank-entry.service";
import { BankEntry } from "./bank-entry.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt.strategy";
import { UsersService } from "../users/users.service";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class BankEntryController {
  constructor(
    private bankEntryService: BankEntryService,
    private usersService: UsersService,
  ) {}

  /**
   * Get all bank entries for a project
   */
  @Get(":projectId/bank-entries")
  async getByProject(@Param("projectId") projectId: string): Promise<BankEntry[]> {
    return this.bankEntryService.getByProject(projectId);
  }

  /**
   * Get single bank entry
   */
  @Get(":projectId/bank-entries/:id")
  async getById(@Param("id") id: string): Promise<BankEntry> {
    return this.bankEntryService.getById(id);
  }

  /**
   * Create new bank entry
   */
  @Post(":projectId/bank-entries")
  async create(
    @Param("projectId") projectId: string,
    @Body() payload: CreateBankEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BankEntry> {
    const actor = user ? await this.usersService.findByAnyId(user.sub) : null;
    return this.bankEntryService.create(projectId, payload, actor);
  }

  /**
   * Update bank entry
   */
  @Put(":projectId/bank-entries/:id")
  async update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() payload: UpdateBankEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BankEntry> {
    const actor = user ? await this.usersService.findByAnyId(user.sub) : null;
    return this.bankEntryService.update(id, payload, actor);
  }

  /**
   * Delete bank entry
   */
  @Delete(":projectId/bank-entries/:id")
  async delete(@Param("id") id: string): Promise<void> {
    return this.bankEntryService.delete(id);
  }
}
