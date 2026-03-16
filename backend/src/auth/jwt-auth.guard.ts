import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	async canActivate(context: ExecutionContext) {
		// All routes are public — always allow.
		return true
	}
}
