import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import CompanyTable from '../../components/companies/CompanyTable'
import CompanyFormModal from '../../components/companies/CompanyFormModal'
import * as companyService from '../../services/company.service'
import { getUser } from '../../services/user.service'
import { Company } from '../../types/company'
import { useAuth } from '../../auth/AuthProvider'
import { useTranslation } from 'react-i18next'
import jwtDecode from 'jwt-decode'
import { extractRolesFromTokenPayload } from '../../utils/tokenRoles'
import { useNavigate } from 'react-router-dom'

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
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
          const isMaster = roles.includes('MASTER')
          if (!isMaster) return navigate('/dashboard')
          return
        }

        // No token: check local DB user id and fetch user for role
        const dbId = localStorage.getItem('db_user_id')
        if (!dbId) return navigate('/dashboard')
        try {
          const userResp = await getUser(dbId)
          const role = String((userResp as any)?.role ?? '').toUpperCase()
          if (role !== 'MASTER') return navigate('/dashboard')
        } catch (e) {
          return navigate('/dashboard')
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
      const data = await companyService.getCompanies()
      setCompanies(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = () => {
    setSelectedCompany(null)
    setModalOpen(true)
  }

  const handleEdit = (c: Company) => {
    setSelectedCompany(c)
    setModalOpen(true)
  }

  const handleDelete = async (c: Company) => {
    if (!confirm(t('companies.deleteConfirm', { name: c.name }))) return
    try {
      setLoading(true)
      await companyService.deleteCompany(c.id)
      setToast({ type: 'success', message: t('companies.deleted') })
      await load()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || t('companies.deleteFailed') })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (payload: any) => {
    try {
      setSaving(true)
      if (selectedCompany) {
        await companyService.updateCompany(selectedCompany.id, payload)
        setToast({ type: 'success', message: t('companies.updated') })
      } else {
        await companyService.createCompany(payload)
        setToast({ type: 'success', message: t('companies.created') })
      }
      setModalOpen(false)
      await load()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || t('companies.saveFailed') })
    } finally {
      setSaving(false)
    }
  }

  const { t } = useTranslation()

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('companies.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>{t('companies.add')}</Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <CompanyTable companies={companies} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <CompanyFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} company={selectedCompany} saving={saving} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.type} onClose={() => setToast(null)}>{toast.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}

export default CompaniesPage
