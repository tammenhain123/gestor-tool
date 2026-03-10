import axios from 'axios'
import qs from 'qs'

export type TokenResponse = {
  access_token: string
  expires_in: number
  refresh_expires_in?: number
  refresh_token?: string
  token_type: string
  id_token?: string
  scope?: string
}

const KC_TOKEN_URL = 'http://localhost:8080/realms/white-label/protocol/openid-connect/token'
const CLIENT_ID = 'web-client'
const CLIENT_SECRET = (import.meta.env as any).VITE_KEYCLOAK_CLIENT_SECRET || ''
const USE_KC = (import.meta.env as any).VITE_USE_KEYCLOAK || 'false'

export function tokenLogin(username: string, password: string): Promise<TokenResponse> {
  if (USE_KC !== 'false') {
    const data = qs.stringify({
      grant_type: 'password',
      client_id: CLIENT_ID,
      username,
      password,
      ...(CLIENT_SECRET ? { client_secret: CLIENT_SECRET } : {}),
      scope: 'openid'
    })

    return axios
      .post(KC_TOKEN_URL, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .then((r) => r.data)
  }

  // fallback: call backend local auth when Keycloak is disabled
  return axios.post('/api/auth/login', { username, password }).then((r) => r.data)
}

export function refreshToken(refresh_token: string): Promise<TokenResponse> {
  if (USE_KC !== 'false') {
    const data = qs.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token,
      ...(CLIENT_SECRET ? { client_secret: CLIENT_SECRET } : {}),
    })

    return axios
      .post(KC_TOKEN_URL, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .then((r) => r.data)
  }

  // no-op refresh for local auth: re-login is required client-side
  return Promise.reject(new Error('Refresh not supported in local auth'))
}

export default { tokenLogin, refreshToken }
