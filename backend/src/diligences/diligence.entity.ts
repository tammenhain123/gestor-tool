import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm'
import { Project } from '../projects/project.entity'
import { User } from '../users/user.entity'

@Entity()
export class Diligence {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Project, { eager: true })
  project!: Project

  @ManyToOne(() => User, { eager: true })
  requester!: User

  @ManyToOne(() => User, { eager: true })
  assignee!: User

  @Column({ type: 'timestamptz' })
  startAt!: Date

  @Column({ type: 'timestamptz' })
  endAt!: Date

  @Column({ nullable: true, type: 'text' })
  description?: string

  @Column({ default: 'PENDING' })
  status!: string

  @CreateDateColumn()
  createdAt!: Date
}
