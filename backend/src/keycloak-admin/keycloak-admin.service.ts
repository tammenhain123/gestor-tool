import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'

interface KcUserCreate {
  username: string
  email: string
  password?: string
  attributes?: Record<string, any>
}

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name)
  private base = process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080'
  private realm = process.env.KEYCLOAK_REALM || 'master'
  private clientId = process.env.KEYCLOAK_CLIENT_ID || ''
  private clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || ''

  // allow running without Keycloak by setting USE_KEYCLOAK=false in env
  private useKeycloak = (process.env.USE_KEYCLOAK || 'true') !== 'false'

  private async getAdminToken(): Promise<string> {
    if (!this.useKeycloak) {
      // when Keycloak is disabled, don't attempt to fetch a token
      this.logger.log('Keycloak disabled: skipping admin token request')
      return ''
    }

    // validate configuration early
    if (!this.base || !this.realm || !this.clientId || !this.clientSecret) {
      this.logger.error('Keycloak configuration missing', {
        base: this.base,
        realm: this.realm,
        clientId: !!this.clientId,
        clientSecret: !!this.clientSecret,
      })
      throw new InternalServerErrorException('Keycloak configuration missing')
    }

    const url = `${this.base}/realms/${this.realm}/protocol/openid-connect/token`
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('client_id', this.clientId)
    params.append('client_secret', this.clientSecret)

    try {
      const resp = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      return resp.data.access_token
    } catch (err: any) {
      // log axios response details if available
      const resp = err?.response
      this.logger.error('Failed to get admin token', {
        message: err?.message,
        status: resp?.status,
        data: resp?.data,
        url,
      })
      const msg = resp ? `Keycloak token error: ${resp.status} - ${JSON.stringify(resp.data)}` : 'Keycloak token error'
      throw new InternalServerErrorException(msg)
    }
  }

  async createUserInKeycloak(data: KcUserCreate) {
    if (!this.useKeycloak) {
      // emulate a created user id when Keycloak is disabled
      const fakeId = `local-${Date.now()}`
      return { id: fakeId }
    }
    const token = await this.getAdminToken()
    const url = `${this.base}/admin/realms/${this.realm}/users`
    try {
      const payload: any = {
        username: data.username,
        email: data.email,
        enabled: true,
        attributes: data.attributes || {},
      }
      if (data.password) {
        payload.credentials = [
          {
            type: 'password',
            value: data.password,
            temporary: false,
          },
        ]
      }

      await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } })

      // after create, we need to fetch the user by username to get id
      const search = `${this.base}/admin/realms/${this.realm}/users?username=${encodeURIComponent(data.username)}`
      const resp = await axios.get(search, { headers: { Authorization: `Bearer ${token}` } })
      const users = resp.data
      if (!users || users.length === 0) throw new Error('User created but not found')
      return users[0]
    } catch (err) {
      this.logger.error('Failed to create user in keycloak', err as any)
      throw new InternalServerErrorException('Keycloak create user error')
    }
  }

  async assignRealmRole(userId: string, roleName: string) {
    if (!this.useKeycloak) return
    const token = await this.getAdminToken()
    try {
      const roleUrl = `${this.base}/admin/realms/${this.realm}/roles/${encodeURIComponent(roleName)}`
      const roleResp = await axios.get(roleUrl, { headers: { Authorization: `Bearer ${token}` } })
      const role = roleResp.data
      const assignUrl = `${this.base}/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}/role-mappings/realm`
      await axios.post(assignUrl, [role], { headers: { Authorization: `Bearer ${token}` } })
    } catch (err) {
      this.logger.error('Failed to assign realm role', err as any)
      throw new InternalServerErrorException('Keycloak assign role error')
    }
  }

  async removeRealmRole(userId: string, roleName: string) {
    if (!this.useKeycloak) return
    const token = await this.getAdminToken()
    try {
      const roleUrl = `${this.base}/admin/realms/${this.realm}/roles/${encodeURIComponent(roleName)}`
      const roleResp = await axios.get(roleUrl, { headers: { Authorization: `Bearer ${token}` } })
      const role = roleResp.data
      const assignUrl = `${this.base}/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}/role-mappings/realm`
      // axios.delete supports a request body via the `data` option
      await axios.delete(assignUrl, { headers: { Authorization: `Bearer ${token}` }, data: [role] })
    } catch (err) {
      this.logger.error('Failed to remove realm role', err as any)
      throw new InternalServerErrorException('Keycloak remove role error')
    }
  }

  async deleteUser(userId: string) {
    if (!this.useKeycloak) return
    const token = await this.getAdminToken()
    try {
      const url = `${this.base}/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}`
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } })
    } catch (err) {
      this.logger.error('Failed to delete user in keycloak', err as any)
      throw new InternalServerErrorException('Keycloak delete user error')
    }
  }
}
