import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	async canActivate(context: ExecutionContext) {
		// Ensure `req.user` is populated when possible (from bearer token or
		// X-DB-USER-ID header) so controllers that read `user.sub` don't crash.
		const req: any = context.switchToHttp().getRequest()

		try {
			// Try to populate from Authorization: Bearer <token>
			const auth = req.headers?.authorization || ''
			const token = Array.isArray(auth) ? auth[0].split(' ')[1] : (auth.split(' ')[1] || null)
			if (token) {
				try {
					const parts = token.split('.')
					if (parts.length >= 2) {
						const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
						req.user = payload
					}
				} catch (e) {
					// ignore token parse errors
				}
			}
		} catch (e) {
			// ignore
		}

		// If no token payload, try X-DB-USER-ID header (set by frontend when
		// using local DB auth)
		try {
			const dbUserId = req.headers['x-db-user-id'] || req.headers['x-db_user_id'] || req.headers['x-db-userid'] || req.headers['x-db_userid']
			if (dbUserId) {
				const id = Array.isArray(dbUserId) ? dbUserId[0] : dbUserId
				if (!req.user) req.user = {}
				if (!req.user.sub) req.user.sub = String(id)
			}
		} catch (e) {
			// ignore
		}

		// Ensure `req.user` is defined to avoid null dereferences in controllers
		if (!req.user) req.user = {}

		// All routes are public — allow request to proceed
		return true
	}
}
