import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt'
import * as jwksRsa from 'jwks-rsa'
import { ConfigService } from '@nestjs/config'

export type JwtPayload = {
  sub: string
  preferred_username?: string
  email?: string
  tenant_id?: string
  iss?: string
  aud?: string | string[]
  [key: string]: unknown
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    const useKc = (process.env.USE_KEYCLOAK || 'true') !== 'false'

    const stripQuotes = (s?: string) => (s ? s.replace(/^\s*\"?(.*)\"?\s*$/, '$1') : s)

    let opts: StrategyOptions

    if (!useKc) {
      opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'dev-no-keycloak-secret',
        algorithms: ['HS256'],
      }
    } else {
      const rawIssuer = config.get<string>('KEYCLOAK_ISSUER')
      const rawAudience = config.get<string>('KEYCLOAK_AUDIENCE')
      const rawJwksUri = config.get<string>('KEYCLOAK_JWKS_URI')

      const issuer = stripQuotes(rawIssuer)
      const audience = stripQuotes(rawAudience)
      const jwksUri = stripQuotes(rawJwksUri)

      if (!issuer) {
        throw new Error('Environment variable KEYCLOAK_ISSUER is not set')
      }
      if (!audience) {
        throw new Error('Environment variable KEYCLOAK_AUDIENCE is not set')
      }
      if (!jwksUri) {
        throw new Error('Environment variable KEYCLOAK_JWKS_URI is not set')
      }

      const secretProvider = jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: jwksUri,
      })

      opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKeyProvider: secretProvider as any,
        algorithms: ['RS256'],
        issuer,
      }
    }

    super(opts)
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const useKc = (process.env.USE_KEYCLOAK || 'true') !== 'false'
    if (!useKc) {
      if (!payload) throw new UnauthorizedException('Invalid token payload')
      return payload
    }

    const rawIssuer = this.config.get<string>('KEYCLOAK_ISSUER')
    const rawAudience = this.config.get<string>('KEYCLOAK_AUDIENCE')
    const stripQuotes = (s?: string) => (s ? s.replace(/^\s*\"?(.*)\"?\s*$/, '$1') : s)
    const issuer = stripQuotes(rawIssuer)
    const audience = stripQuotes(rawAudience)

    if (!issuer) throw new UnauthorizedException('Server not configured: KEYCLOAK_ISSUER')
    if (!audience) throw new UnauthorizedException('Server not configured: KEYCLOAK_AUDIENCE')

    // no debug logging here in production/dev

    if (!payload) {
      throw new UnauthorizedException('Invalid token payload')
    }

    if (payload.iss !== issuer) {
      throw new UnauthorizedException('Invalid token issuer')
    }

    const aud = payload.aud
    const azp = (payload as any).azp
    // accept if audience matches token aud (string or array) OR if azp (authorized party) matches expected audience
    const audMatches =
      (typeof aud === 'string' && aud === audience) ||
      (Array.isArray(aud) && aud.includes(audience))

    if (!audMatches && azp !== audience) {
      throw new UnauthorizedException('Invalid token audience')
    }

    if (!payload.sub) throw new UnauthorizedException('Token missing sub')

    // tenant_id may be absent for MASTER users (global)

    return payload
  }
}
