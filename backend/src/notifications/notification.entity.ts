import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm'
import { User } from '../users/user.entity'

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, { eager: true })
  user!: User

  @Column('text')
  message!: string

  @Column({ default: false })
  read!: boolean

  @Column({ nullable: true })
  link?: string

  @CreateDateColumn()
  createdAt!: Date
}
