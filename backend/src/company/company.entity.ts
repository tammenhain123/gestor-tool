import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { User } from '../users/user.entity'

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string

  @Column({ type: 'text', nullable: true })
  logoUrl?: string | null

  @Column({ type: 'varchar', length: 32, default: '#000000' })
  primaryColor!: string

  @Column({ type: 'varchar', length: 32, default: '#ffffff' })
  secondaryColor!: string

  @Column({ type: 'boolean', default: true })
  active!: boolean

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date

  @OneToMany(() => User, (user) => user.company)
  users?: User[]
}
