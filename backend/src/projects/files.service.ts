import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProjectFile } from './file.entity'

@Injectable()
export class ProjectFilesService {
  constructor(
    @InjectRepository(ProjectFile)
    private repo: Repository<ProjectFile>,
  ) {}

  async create(data: Partial<ProjectFile>) {
    const ent = this.repo.create(data)
    return this.repo.save(ent)
  }

  async findByQualification(projectId: string, qualificationId: string) {
    return this.repo.findOne({ where: { projectId, qualificationId } })
  }

  async findByCapacity(projectId: string, capacityId: string) {
    return this.repo.findOne({ where: { projectId, capacityId } })
  }

  async update(id: string, data: Partial<ProjectFile>) {
    const ent = await this.repo.findOne({ where: { id } })
    if (!ent) return null
    Object.assign(ent, data)
    return this.repo.save(ent)
  }

  async listByProject(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } })
  }

  async findByKey(key: string) {
    return this.repo.findOne({ where: { s3Key: key } })
  }
}
