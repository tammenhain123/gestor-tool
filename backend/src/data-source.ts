import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config } from 'dotenv'
config()

import { Company } from './company/company.entity'
import { User } from './users/user.entity'
import { AuditLog } from './audit/audit.entity'

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Company, User, AuditLog],
  migrations: ['src/migrations/*.ts'],
  // Enable synchronize for local development to apply schema changes immediately
  synchronize: true,
})

export default AppDataSource
