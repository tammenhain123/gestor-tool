import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm'
import { Project } from './project.entity'

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  projectId!: string

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  project?: Project

  @Column({ nullable: true })
  qualificationId?: string

  @Column({ nullable: true })
  capacityId?: string

  @Column({ type: 'text' })
  descricao!: string

  @Column({ type: 'text', nullable: true })
  apresentacao?: string

  @Column({ nullable: true })
  matricula?: string

  @Column({ nullable: true })
  valorAtual?: string

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date
}
