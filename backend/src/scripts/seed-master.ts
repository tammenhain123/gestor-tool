import 'dotenv/config'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, Role } from '../users/user.entity'

async function bootstrap() {
  const logger = new Logger('SeedMaster')
  const app = await NestFactory.createApplicationContext(AppModule)

  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User))

    const username = 'MasterUser'
    const email = 'luizrobertoff@gestortool.com.br'

    logger.log('Checking MASTER user...')

    const exists = await userRepo.findOne({
      where: { role: Role.MASTER },
    })

    if (exists) {
      logger.log('MASTER already exists.')
      return
    }

    const user = userRepo.create({
      username,
      email,
      role: Role.MASTER,
      tenantId: null,
    })

    await userRepo.save(user)

    logger.log('MASTER created successfully.')
  } catch (err) {
    logger.error('Seed error', err as any)
  } finally {
    await app.close()
  }
}

bootstrap()
