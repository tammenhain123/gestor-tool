import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm'
import { Project } from './project.entity'

@Entity('bank_entries')
export class BankEntry {
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
  banco!: string

  @Column({ nullable: true })
  numeroConta?: string

  @Column({ nullable: true })
  agencia?: string

  @Column({ nullable: true })
  ano?: string

  @Column({ nullable: true })
  mes?: string

  @Column({ nullable: true })
  s3Key?: string

  @Column({ nullable: true })
  originalName?: string

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date
}
