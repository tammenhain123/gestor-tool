import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../../auth/jwt.strategy'

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JwtPayload | null => {
  const req = ctx.switchToHttp().getRequest()
  return req.user ?? null
})
