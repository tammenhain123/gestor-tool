import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm'
import { Project } from './project.entity'

@Entity('financial_docs')
export class FinancialDoc {
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

  @Column()
  label!: string

  @Column({ nullable: true })
  s3Key?: string

  @Column({ nullable: true })
  originalName?: string

  @Column({ nullable: true })
  meta?: string

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date
}
