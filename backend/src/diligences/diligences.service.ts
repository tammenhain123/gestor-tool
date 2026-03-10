import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Diligence } from './diligence.entity'
import { ProjectsService } from '../projects/projects.service'
import { UsersService } from '../users/users.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateDiligenceDto } from './dto/create-diligence.dto'

@Injectable()
export class DiligencesService {
  constructor(
    @InjectRepository(Diligence) private readonly repo: Repository<Diligence>,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateDiligenceDto, requesterSub: string) {
    const requester = await this.usersService.findByAnyId(requesterSub)
    if (!requester) throw new NotFoundException('Requester not found')

    const project = await this.projectsService.findOne(dto.projectId)
    if (!project) throw new NotFoundException('Project not found')

    // ensure requester belongs to same company as project (or is MASTER)
    if (requester.role !== 'MASTER' && requester.tenantId !== (project.company as any).id) {
      throw new BadRequestException('Requester not allowed for this project')
    }

    const assignee = await this.usersService.findOne(dto.assigneeId)
    if (!assignee) throw new NotFoundException('Assignee not found')

    const d = this.repo.create({
      project: project as any,
      requester: requester as any,
      assignee: assignee as any,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      description: dto.description,
    })

    const saved = await this.repo.save(d)

    // create notification for assignee
    const message = `Foi pedida uma diligência no projeto ${project.name}`
    await this.notifications.create(assignee as any, message, `/projects/${project.id}`)

    return saved
  }

  async findForUser(userId: string) {
    return this.repo.find({ where: [{ assignee: { id: userId } }, { requester: { id: userId } }], order: { createdAt: 'DESC' } })
  }
}
