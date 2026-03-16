import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common'
import { UsersService } from '../users/users.service'

@Controller('auth')
export class LocalAuthController {
  constructor(private readonly usersService: UsersService) {}

  // New simple login endpoint: validates username+password against DB and
  // returns the DB user id on success.
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const username = body.username || ''
    const password = body.password || ''

    // find by username field
    let dbUser = await this.usersService.findByUsername(username)
    if (!dbUser) {
      // also allow matching by local-<username> keycloakId
      const possibleKeycloakId = `local-${username}`
      dbUser = await this.usersService.findByAnyId(possibleKeycloakId)
    }

    if (!dbUser) throw new UnauthorizedException('Invalid credentials')

    // Simple dev login: validate only that the user exists, no password check.
    // Return the DB user id and role to the client so the frontend can
    // persist user role locally without additional lookups.
    return { userId: dbUser.id, role: dbUser.role }
  }
}
