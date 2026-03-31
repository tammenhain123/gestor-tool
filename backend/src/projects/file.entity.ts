import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'project_files' })
export class ProjectFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  projectId!: string

  @Column()
  s3Key!: string

  @Column()
  originalName!: string

  @Column()
  mimeType!: string

  @Column('bigint')
  size!: number

  @Column({ nullable: true })
  uploadedBy?: string

  @Column({ nullable: true })
  qualificationId?: string

  @Column({ nullable: true })
  capacityId?: string

  @Column({ nullable: true })
  companyId?: string

  @Column({ nullable: true })
  labelKey?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
