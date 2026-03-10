import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import ProjectTable from '../components/projects/ProjectTable'
import { useNavigate } from 'react-router-dom'
import * as projectService from '../services/project.service'
import { Project } from '../types/project'
import { useTranslation } from 'react-i18next'

const ProjectsPublic: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

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

  const navigate = useNavigate()
  const handleOpen = (p: Project) => navigate(`/projects/${p.id}`)

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{t('nav.projects')}</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <ProjectTable projects={projects} showActions={false} onOpen={handleOpen} />
      )}
    </Box>
  )
}

export default ProjectsPublic
