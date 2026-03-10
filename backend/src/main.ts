import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, Role } from './users/user.entity'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'https://www.gestortool.com.br',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true,
  });

  // Ensure a MASTER user exists in the database (same logic as scripts/seed-master.ts)
  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User))

    const username = 'MasterUser'
    const email = 'luizrobertoff@gestortool.com.br'

    console.log('Checking MASTER user...')

    const exists = await userRepo.findOne({ where: { role: Role.MASTER } })

    // create or ensure provisional password exists (stored plain-text as requested)
    const provisionalPassword = 'GestorTool!989'
    
    if (exists) {
      if (!exists.password) {
        exists.password = provisionalPassword
        await userRepo.save(exists)
        console.log('MASTER existed — provisional password set:', provisionalPassword)
      } else {
        console.log('MASTER already exists.')
      }
    } else {
      const user = userRepo.create({
        keycloakId: '',
        username,
        email,
        password: provisionalPassword,
        role: Role.MASTER,
        tenantId: null,
      })

      await userRepo.save(user)

      console.log('MASTER created successfully. Provisional password:', provisionalPassword)
    }
  } catch (err) {
    console.error('Seed error:', err)
  }

  // Log middleware opcional para debug de headers

  // Porta padrão: EB usa PORT env, fallback para 4000
  const port = Number(process.env.PORT) || 4000;

  await app.listen(port);
  console.log(`🚀 Application is running on port ${port}`);
}

bootstrap();