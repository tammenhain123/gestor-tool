import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { AuditService } from './audit.service'

const SENSITIVE_KEYS = [
  'password',
  'passwordConfirmation',
  'oldPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'creditCard',
  'cvv',
]

function sanitize(value: any): any {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(sanitize)
  if (typeof value === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.includes(k)) {
        out[k] = '[REDACTED]'
        continue
      }
      out[k] = sanitize(v)
    }
    return out
  }
  return value
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name)

  constructor(private readonly auditService: AuditService, private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    if (!req) return next.handle()

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()])
    if (isPublic) return next.handle()

    const user = req.user
    if (!user) return next.handle()

    const method = req.method
    const path = req.path || req.url
    const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress

    const params = sanitize(req.params || {})
    const query = sanitize(req.query || {})
    const body = sanitize(req.body || {})

    const entityFromPath = (path || '').split('/').filter(Boolean)[0] || context.getClass().name
    const entityId = params?.id || params?.uuid || null

    const entry = {
      userId: String(user.id ?? user.sub ?? user.userId ?? user.username ?? ''),
      username: String(user.username ?? user.email ?? user.name ?? ''),
      roles: user.roles ?? [],
      tenantId: String(user.tenantId ?? user.tenant ?? user['tenant_id'] ?? ''),
      action: context.getHandler().name ?? method,
      entity: entityFromPath,
      entityId: entityId ? String(entityId) : null,
      method,
      path,
      ipAddress: String(ip ?? ''),
      metadata: { params, query, body },
    }

    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            await this.auditService.create(entry)
          } catch (err) {
            this.logger.error('Audit save failed', err as any)
          }
        },
      }),
    )
  }
}
