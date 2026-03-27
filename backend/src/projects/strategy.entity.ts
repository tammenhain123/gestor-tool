import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm'
import { Project } from './project.entity'

@Entity('strategies')
export class Strategy {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Project, { nullable: false, onDelete: 'CASCADE' })
  project!: Project

  @Column({ type: 'jsonb', nullable: true })
  data?: any

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date
}
