import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from './notification.entity'
import { User } from '../users/user.entity'

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  async create(recipient: User, message: string, link?: string) {
    const n = this.repo.create({ user: recipient, message, link })
    return this.repo.save(n)
  }

  async findByUserId(userId: string) {
    return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } })
  }

  async markRead(id: string) {
    await this.repo.update(id, { read: true })
    return this.repo.findOne({ where: { id } })
  }
}
