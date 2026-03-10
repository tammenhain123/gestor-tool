import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm'
import { Company } from '../company/company.entity'
import { User } from '../users/user.entity'

export enum ProjectType {
  SAAS = 'SAAS',
  OFERTA = 'OFERTA',
  DEMANDA = 'DEMANDA',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  imageUrl?: string | null

  @Column({ type: 'enum', enum: ProjectType })
  type!: ProjectType

  @Column({ type: 'text', nullable: true })
  description?: string | null

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  company!: Company

  @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
  creator!: User

  @ManyToMany(() => User)
  @JoinTable({ name: 'project_users' })
  users?: User[]

  @ManyToMany(() => User)
  @JoinTable({ name: 'project_admins' })
  admins?: User[]

  @ManyToMany(() => User)
  @JoinTable({ name: 'project_viewers' })
  viewers?: User[]

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date
}
