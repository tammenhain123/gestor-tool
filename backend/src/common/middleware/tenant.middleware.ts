import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

declare module 'express' {
  interface Request {
    tenantId?: string
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // If the Passport JWT strategy attached the user payload to `req.user`,
    // extract tenant_id and attach to request for downstream handlers.
    const user = (req as any).user as { tenant_id?: string } | undefined
    if (user && user.tenant_id) {
      req.tenantId = user.tenant_id
    }
    next()
  }
}
