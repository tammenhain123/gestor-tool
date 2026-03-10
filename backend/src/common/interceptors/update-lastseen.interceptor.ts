import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { UsersService } from '../../users/users.service'

@Injectable()
export class UpdateLastSeenInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    try {
      const userPayload = req.user
      const dbIdHeader = req.headers['x-db-user-id'] || req.headers['X-DB-USER-ID']
      if (userPayload && (userPayload as any).sub) {
        // update lastSeen by keycloak id or local id if sub is local
        this.usersService.updateLastSeen((userPayload as any).sub).catch(() => {})
      } else if (dbIdHeader) {
        this.usersService.updateLastSeen(String(dbIdHeader)).catch(() => {})
      }
    } catch (e) {
      // ignore errors
    }
    return next.handle()
  }
}
