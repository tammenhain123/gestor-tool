import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { UsersModule } from '../users/users.module'
import { JwtStrategy } from './jwt.strategy'
import { LocalAuthController } from './local.controller'

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), UsersModule],
  providers: [JwtStrategy],
  controllers: [LocalAuthController],
  exports: [PassportModule]
})
export class AuthModule {}
