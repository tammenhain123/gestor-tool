import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm'
import { Project } from './project.entity'

@Entity('indicators')
export class Indicator {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  projectId!: string

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  project?: Project

  @Column({ nullable: true })
  labelKey?: string

  @Column({ nullable: true })
  descricao?: string

  @Column({ type: 'timestamp with time zone', nullable: true })
  date?: Date

  @Column({ nullable: true })
  s3Key?: string

  @Column({ nullable: true })
  originalName?: string

  @Column({ nullable: true })
  uploadedBy?: string

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date
}
