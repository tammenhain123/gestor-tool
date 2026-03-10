import React, { createContext, useContext, useEffect, useState } from 'react'
import jwtDecode from 'jwt-decode'
import { attachTokenInterceptor, api } from '../services/api'
import { tokenLogin, refreshToken as refreshTokenService, TokenResponse } from '../services/keycloakAuth'

type User = {
  username: string
  email?: string
  tenant_id?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On mount, check localStorage then sessionStorage for existing token set by manual login.
    const storedLocal = localStorage.getItem('auth')
    const storedSession = sessionStorage.getItem('auth')
    const used = storedLocal || storedSession
    // debug: show storage keys and origin
    // eslint-disable-next-line no-console
    console.log('[AuthProvider] origin=', location.origin, 'localKeys=', Object.keys(localStorage), 'sessionKeys=', Object.keys(sessionStorage))
    if (used) {
      try {
        const data: TokenResponse = JSON.parse(used)
        setToken(data.access_token)
        const parsed: any = jwtDecode(data.access_token)
        // Debug: show token payload and roles for troubleshooting
        try {
          const roles = parsed?.realm_access?.roles ?? parsed?.roles ?? parsed?.role ?? []
          // eslint-disable-next-line no-console
          console.debug('[AuthProvider] token payload', parsed)
          // eslint-disable-next-line no-console
          console.debug('[AuthProvider] roles detected', roles)
        } catch (e) {
          // ignore logging errors
        }
        const profile: User = {
          username: parsed.preferred_username || parsed.username || '',
          email: parsed.email,
          tenant_id: parsed.tenant_id || parsed.tid
        }
        setUser(profile)
        // attach interceptor that reads token from storage at request time
        attachTokenInterceptor(() => {
          try {
            const s = JSON.parse(localStorage.getItem('auth') || sessionStorage.getItem('auth') || 'null')
            return s?.access_token
          } catch (e) {
            return null
          }
        })
      } catch (e) {
        // ignore parse errors
      }
    }

    // If no token-based auth found, but a local DB id exists, attach interceptor
    // so requests include X-DB-USER-ID header and attempt to load the local user
    if (!used) {
      try {
        attachTokenInterceptor(() => {
          try {
            const s = JSON.parse(localStorage.getItem('auth') || sessionStorage.getItem('auth') || 'null')
            return s?.access_token
          } catch (e) {
            return null
          }
        })
        const dbId = localStorage.getItem('db_user_id') || sessionStorage.getItem('db_user_id')
        if (dbId) {
          (async () => {
            try {
              const resp = await api.get(`/users/${dbId}`)
              const db = resp?.data
              if (db) setUser({ username: db.username || '', email: db.email || undefined, tenant_id: db.tenantId || db?.company?.id || undefined })
            } catch (e) {
              // ignore
            }
          })()
        }
      } catch (e) {
        // ignore
      }
    }

    setLoading(false)

    // refresh token periodically if we have a refresh token
    const refreshInterval = setInterval(() => {
      const stored2 = localStorage.getItem('auth')
      if (!stored2) return
      try {
        const data: TokenResponse = JSON.parse(stored2)
        if (data.refresh_token) {
          refreshTokenService(data.refresh_token)
            .then((resp) => {
              if (resp.access_token) {
                setToken(resp.access_token)
                localStorage.setItem('auth', JSON.stringify(resp))
                attachTokenInterceptor(() => resp.access_token)
              }
            })
            .catch(() => {
              // failed refresh - do nothing, user will need to login again
            })
        }
      } catch (e) {
        // ignore
      }
    }, 60000)

    return () => clearInterval(refreshInterval)
  }, [])

  const login = (username?: string, password?: string) => {
    // If username/password provided, do direct token call; otherwise fallback
    // to Keycloak redirect (not used by default)
    if (username && password) {
      return tokenLogin(username, password).then((resp) => {
        // If using local auth, backend returns `local_user_id` (DB id).
        if ((resp as any).local_user_id || (resp as any).localUserId || (resp as any).userId) {
          const dbId = (resp as any).local_user_id || (resp as any).localUserId || (resp as any).userId
          localStorage.setItem('db_user_id', dbId)
          // set a minimal user profile for UI
          setUser({ username: username, email: undefined, tenant_id: undefined })
          // ensure API interceptor is attached so X-DB-USER-ID header is sent
          attachTokenInterceptor(() => {
            try {
              const s = JSON.parse(localStorage.getItem('auth') || sessionStorage.getItem('auth') || 'null')
              return s?.access_token
            } catch (e) {
              return null
            }
          })
          return resp
        }

        // Fallback: treat as token-based response
        // debug: log token receipt
        // eslint-disable-next-line no-console
        console.log('[AuthProvider] token received', { hasAccessToken: !!resp.access_token, expires_in: resp.expires_in })
        setToken(resp.access_token)
        const parsed: any = jwtDecode(resp.access_token)
        const profile: User = {
          username: parsed.preferred_username || parsed.username || '',
          email: parsed.email,
          tenant_id: parsed.tenant_id || parsed.tid
        }
        // Debug: show token payload and roles on login
        try {
          const roles = parsed?.realm_access?.roles ?? parsed?.roles ?? parsed?.role ?? []
          // eslint-disable-next-line no-console
          console.debug('[AuthProvider] token payload (login)', parsed)
          // eslint-disable-next-line no-console
          console.debug('[AuthProvider] roles detected (login)', roles)
        } catch (e) {
          // ignore
        }
        setUser(profile)
        // save to both storages for debugging across origins
        localStorage.setItem('auth', JSON.stringify(resp))
        sessionStorage.setItem('auth', JSON.stringify(resp))
        // debug: confirm saved
        // eslint-disable-next-line no-console
        console.log('[AuthProvider] saved auth to localStorage?', !!localStorage.getItem('auth'), 'sessionStorage?', !!sessionStorage.getItem('auth'))
        // attach interceptor that reads token from storage at request time
        attachTokenInterceptor(() => {
          try {
            const s = JSON.parse(localStorage.getItem('auth') || sessionStorage.getItem('auth') || 'null')
            return s?.access_token
          } catch (e) {
            return null
          }
        })
        return resp
      })
        .catch((err) => {
          throw err
        })
    }

    // fallback behavior: not implemented
    return Promise.reject(new Error('Interactive login not supported'))
  }

  const logout = (serverLogout = false) => {
    // Clear local tokens and user state
    localStorage.removeItem('auth')
    setUser(null)
    setToken(null)

    if (serverLogout) {
      // Redirect to Keycloak end session only when explicitly requested and
      // when Keycloak client is configured with the exact redirect URI.
      const logoutUrl = `http://localhost:8080/realms/white-label/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(
        window.location.origin + '/'
      )}`
      window.location.href = logoutUrl
    } else {
      // Perform client-side logout and navigate to the app login screen.
      window.location.href = '/login'
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
