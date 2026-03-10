import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import ProjectTable from '../../components/projects/ProjectTable'
import ProjectFormModal from '../../components/projects/ProjectFormModal'
import * as projectService from '../../services/project.service'
import { Project } from '../../types/project'
import { useAuth } from '../../auth/AuthProvider'
import { useTranslation } from 'react-i18next'
import jwtDecode from 'jwt-decode'
import { extractRolesFromTokenPayload } from '../../utils/tokenRoles'
import userService from '../../services/user.service'
import { useNavigate } from 'react-router-dom'

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // prefer DB user role when available
        const dbId = localStorage.getItem('db_user_id')
        if (dbId) {
          try {
            const dbUser = await userService.getUser(dbId)
            if (!mounted) return
            if (dbUser.role === 'MASTER' || dbUser.role === 'ADMIN') return
            return navigate('/dashboard')
          } catch (err) {
            // fallthrough to token-based check
          }
        }

        const stored = localStorage.getItem('auth') || sessionStorage.getItem('auth')
        const token = stored ? JSON.parse(stored)?.access_token : null
        if (!token) return navigate('/dashboard')
        const payload: any = jwtDecode(token)
        const roles = extractRolesFromTokenPayload(payload)
        const allowed = roles.includes('MASTER') || roles.includes('ADMIN')
        if (!allowed) navigate('/dashboard')
      } catch {
        navigate('/dashboard')
      }
    })()
    return () => { mounted = false }
  }, [auth, navigate])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await projectService.getProjects()
      setProjects(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = () => { setSelectedProject(null); setModalOpen(true) }
  const handleEdit = (p: Project) => { setSelectedProject(p); setModalOpen(true) }
  const handleOpen = (p: Project) => { navigate(`/projects/${p.id}`) }

  const handleDelete = async (p: Project) => {
    if (!confirm(t('projects.deleteConfirm'))) return
    try {
      setLoading(true)
      await projectService.deleteProject(p.id)
      setToast({ type: 'success', message: t('projects.deleted') })
      await load()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || t('projects.deleteFailed') })
    } finally { setLoading(false) }
  }

  const handleSave = async (payload: any) => {
    try {
      setSaving(true)
      if (selectedProject) {
        await projectService.updateProject(selectedProject.id, payload)
        setToast({ type: 'success', message: t('projects.updated') })
      } else {
        await projectService.createProject(payload)
        setToast({ type: 'success', message: t('projects.created') })
      }
      setModalOpen(false)
      await load()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Save failed' })
    } finally { setSaving(false) }
  }

  const { t } = useTranslation()

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('nav.projects')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>{t('nav.projects')}</Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <ProjectTable projects={projects} onEdit={handleEdit} onDelete={handleDelete} onOpen={handleOpen} externalToast={toast} clearExternalToast={() => setToast(null)} />
      )}

      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} project={selectedProject} saving={saving} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.type} onClose={() => setToast(null)}>{toast.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}

export default ProjectsPage
