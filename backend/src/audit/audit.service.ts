import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLog } from './audit.entity'

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async create(entry: Partial<AuditLog>): Promise<AuditLog | null> {
    try {
      const r = this.repo.create(entry as AuditLog)
      return await this.repo.save(r)
    } catch (err) {
      this.logger.error('Failed to persist audit log', err as any)
      return null
    }
  }
}
