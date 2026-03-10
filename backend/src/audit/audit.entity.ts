import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId!: string

  @Column()
  username!: string

  @Column({ type: 'jsonb' })
  roles: any = []

  @Column()
  tenantId!: string

  @Column()
  action!: string

  @Column()
  entity!: string

  @Column({ type: 'varchar', nullable: true })
  entityId: string | null = null

  @Column()
  method!: string

  @Column()
  path!: string

  @Column()
  ipAddress!: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any

  @CreateDateColumn()
  createdAt!: Date
}
