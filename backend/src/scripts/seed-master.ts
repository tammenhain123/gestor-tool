import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, Role } from '../users/user.entity'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)

  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User))

    const username = 'MasterUser'
    const email = 'luizrobertoff@gestortool.com.br'

    console.log('Checking MASTER user...')

    const exists = await userRepo.findOne({
      where: { role: Role.MASTER },
    })

    if (exists) {
      console.log('MASTER already exists.')
      return
    }

    const user = userRepo.create({
      username,
      email,
      role: Role.MASTER,
      tenantId: null,
    })

    await userRepo.save(user)

    console.log('MASTER created successfully.')
  } catch (err) {
    console.error('Seed error:', err)
  } finally {
    await app.close()
  }
}

bootstrap()