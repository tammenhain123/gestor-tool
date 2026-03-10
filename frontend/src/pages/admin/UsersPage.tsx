import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import UserTable from '../../components/users/UserTable'
import UserFormModal from '../../components/users/UserFormModal'
import { fetchUsers, createUser, updateUser, deleteUser, getUser } from '../../services/user.service'
import { User, CreateUserDto } from '../../types/user'
import { useAuth } from '../../auth/AuthProvider'
import { useTranslation } from 'react-i18next'
import jwtDecode from 'jwt-decode'
import { extractRolesFromTokenPayload } from '../../utils/tokenRoles'
import { useNavigate } from 'react-router-dom'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const stored = localStorage.getItem('auth') || sessionStorage.getItem('auth')
        const token = stored ? JSON.parse(stored)?.access_token : null
        if (token) {
          const payload: any = jwtDecode(token)
          const roles = extractRolesFromTokenPayload(payload)
          const allowed = roles.includes('MASTER') || roles.includes('ADMIN')
          if (!allowed) return navigate('/dashboard')
          return
        }

        // No token: check local DB id and fetch user
        const dbId = localStorage.getItem('db_user_id') || sessionStorage.getItem('db_user_id')
        if (!dbId) return navigate('/dashboard')
        try {
          const u = await getUser(dbId)
          const role = String((u as any)?.role ?? '').toUpperCase()
          if (role !== 'MASTER' && role !== 'ADMIN') return navigate('/dashboard')
        } catch (e) {
          // Do not redirect immediately; allow load() to surface errors
          return
        }
      } catch (e) {
        navigate('/dashboard')
      }
    }

    checkAccess()
  }, [auth, navigate])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = () => { setSelectedUser(null); setModalOpen(true) }
  const handleEdit = (u: User) => { setSelectedUser(u); setModalOpen(true) }

  const handleDelete = async (u: User) => {
    if (!confirm(t('users.deleteConfirm'))) return
    try {
      setLoading(true)
      await deleteUser(u.id)
      setToast({ type: 'success', message: t('users.deleted') })
      await load()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || t('users.deleteFailed') })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (payload: CreateUserDto) => {
    try {
      setSaving(true)
      if (selectedUser) {
        await updateUser(selectedUser.id, payload)
        setToast({ type: 'success', message: t('users.updated') })
      } else {
        await createUser(payload)
        setToast({ type: 'success', message: t('users.created') })
      }
      setModalOpen(false)
      await load()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || t('users.saveFailed') })
    } finally {
      setSaving(false)
    }
  }

  const { t } = useTranslation()

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('nav.users')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>{t('nav.users')}</Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} user={selectedUser} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.type} onClose={() => setToast(null)}>{toast.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
