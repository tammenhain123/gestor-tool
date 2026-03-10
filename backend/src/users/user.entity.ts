import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm'
import { Company } from '../company/company.entity'

export enum Role {
  MASTER = 'MASTER',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  keycloakId!: string

  @Column({ type: 'varchar', length: 150, nullable: true })
  username!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string | null


  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role

  @ManyToOne(() => Company, (company) => company.users, { nullable: true, onDelete: 'SET NULL' })
  company?: Company | null

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date
  
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastSeen?: Date | null
}
