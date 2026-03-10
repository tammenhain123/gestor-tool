import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	async canActivate(context: ExecutionContext) {
		// Allow unauthenticated access to the login endpoint
		try {
			const reqPath = context.switchToHttp().getRequest().path || ''
			// Allow unauthenticated access to login and health endpoints
			// Note: app sets a global prefix (`/api`), so endpoints may appear as `/api/...`.
			if (/(^|\/)auth\/(?:login|local)(\/|$)/.test(reqPath) || /(^|\/)health(\/|$)/.test(reqPath)) return true
		} catch (e) {}
		const useKc = (process.env.USE_KEYCLOAK || 'true') !== 'false'
		if (!useKc) {
			// When Keycloak is disabled, do not require authentication.
			// If a fake token or X-DB-USER-ID header is present, populate `req.user`.
			const req = context.switchToHttp().getRequest()
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
					// ignore token parse errors in local mode
				}
			}

			const dbUserId = req.headers['x-db-user-id'] || req.headers['x-db_user_id'] || req.headers['x-db-userid']
			if (dbUserId) {
				const id = Array.isArray(dbUserId) ? dbUserId[0] : dbUserId
				req.user = { sub: String(id) }
			}

			// Ensure req.user is at least an object to avoid null derefs in controllers
			req.user = req.user || {}

			// In local mode do not block requests; allow all
			return true
		}
		return (await super.canActivate(context)) as boolean
	}
}
