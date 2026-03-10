import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, MenuItem } from '@mui/material'
import jwtDecode from 'jwt-decode'
import { CreateUserDto, Role, User } from '../../types/user'
import { fetchCompanies } from '../../services/companyService'
import { getUser as fetchLocalUser } from '../../services/user.service'
import { useAuth } from '../../auth/AuthProvider'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (dto: CreateUserDto) => void
  user?: User | null
}

export default function UserFormModal({ open, onClose, onSave, user }: Props) {
  const { user: authUser, token } = useAuth()

  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(user?.role ?? 'USER')
  const [companyId, setCompanyId] = useState<string | undefined>(user?.company?.id ?? undefined)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])

  // derive current user's roles from token when available
  const [currentRoles, setCurrentRoles] = useState<string[]>([])
  useEffect(() => {
    if (!token) return setCurrentRoles([])
    try {
      const parsed: any = jwtDecode(token)
      const roles = parsed?.realm_access?.roles ?? parsed?.roles ?? parsed?.role ?? []
      setCurrentRoles(Array.isArray(roles) ? roles : [roles])
    } catch (e) {
      setCurrentRoles([])
    }
  }, [token])

  // If there's no token but a local DB login exists, fetch local user to determine role/tenant
  useEffect(() => {
    if (token) return
    const dbId = localStorage.getItem('db_user_id') || sessionStorage.getItem('db_user_id')
    if (!dbId) return
    let mounted = true
    fetchLocalUser(dbId)
      .then((u) => {
        if (!mounted) return
        const r = String((u as any)?.role ?? '').toUpperCase()
        if (r === 'MASTER') setCurrentRoles(['MASTER'])
        else if (r === 'ADMIN') setCurrentRoles(['ADMIN'])
        // if opening creation modal and current user is ADMIN, preselect tenant
        if (!user && r === 'ADMIN') {
          const tenant = (u as any)?.company?.id ?? (u as any)?.tenantId
          if (tenant) setCompanyId(tenant)
        }
      })
      .catch(() => {
        // ignore
      })
    return () => { mounted = false }
  }, [token, user])

  const isMaster = currentRoles.includes('MASTER')
  const isAdmin = !isMaster && currentRoles.includes('ADMIN')

  useEffect(() => {
    setUsername(user?.username ?? '')
    setEmail(user?.email ?? '')
    setRole(user?.role ?? 'USER')
    setCompanyId(user?.company?.id ?? undefined)
    setPassword('')
  }, [user])

  // Ensure form is reset when opening a "new user" modal
  useEffect(() => {
    if (open && !user) {
      setUsername('')
      setEmail('')
      setPassword('')
      setRole('USER')
      setCompanyId(undefined)
    }
  }, [open, user])

  useEffect(() => {
    let mounted = true
    fetchCompanies().then((data) => {
      if (mounted) setCompanies(data)
    })
    return () => { mounted = false }
  }, [])

  // If opening modal to create a new user and current user is ADMIN, default company to admin's tenant and lock it
  useEffect(() => {
    if (open && !user && isAdmin) {
      const tenant = authUser?.tenant_id
      if (tenant) setCompanyId(tenant)
    }
  }, [open, user, isAdmin, authUser])

  function handleSave() {
    const dto: CreateUserDto = { username, email, role, companyId }
    if (!user && password) dto.password = password
    onSave(dto)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
      <DialogContent>
        <TextField margin="dense" label="Username" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField margin="dense" label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        {!user && (
          <TextField margin="dense" label="Password" fullWidth type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        <TextField
          select
          margin="dense"
          label="Role"
          fullWidth
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {isMaster && <MenuItem value="MASTER">MASTER</MenuItem>}
          <MenuItem value="ADMIN">ADMIN</MenuItem>
          <MenuItem value="USER">USER</MenuItem>
        </TextField>

        <TextField
          select
          margin="dense"
          label="Company"
          fullWidth
          value={companyId ?? ''}
          onChange={(e) => setCompanyId(e.target.value || undefined)}
          // disable company selection for ADMIN users when creating a new user
          disabled={isAdmin && !user}
        >
          {!companyId && <MenuItem value="">(none)</MenuItem>}
          {companies.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}
