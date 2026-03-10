import React, { useEffect, useState } from 'react'
import { Box, Button, TextField, MenuItem, Select, InputLabel, FormControl, Typography, Snackbar, Alert, Grid } from '@mui/material'
import projectService from '../services/project.service'
import userService, { fetchUsers } from '../services/user.service'
import diligenceService from '../services/diligence.service'
import { useTranslation } from 'react-i18next'

const DiligencesPage: React.FC = () => {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [projectId, setProjectId] = useState<string>('')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [startAt, setStartAt] = useState<string>('')
  const [endAt, setEndAt] = useState<string>('')
  const [desc, setDesc] = useState<string>('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const ps = await projectService.getProjects()
        if (!mounted) return
        setProjects(ps)
        const us = await fetchUsers()
        if (!mounted) return
        setUsers(us)
      } catch (e) {}
    })()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async () => {
    try {
      await diligenceService.createDiligence({ projectId, assigneeId, startAt, endAt, description: desc })
      setToast({ type: 'success', message: t('diligences.created') || 'Diligence created' })
      setProjectId('')
      setAssigneeId('')
      setStartAt('')
      setEndAt('')
      setDesc('')
    } catch (e: any) {
      setToast({ type: 'error', message: e?.response?.data?.message || e.message || 'Failed' })
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">{t('diligences.title') || 'Diligences'}</Typography>

      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('diligences.project')}</InputLabel>
              <Select value={projectId} label={t('diligences.project')} onChange={(e) => setProjectId(String(e.target.value))}>
                {(Array.isArray(projects) ? projects : []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('diligences.assignee')}</InputLabel>
              <Select value={assigneeId} label={t('diligences.assignee')} onChange={(e) => setAssigneeId(String(e.target.value))}>
                {(Array.isArray(users) ? users : []).map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField type="date" label={t('diligences.start')} InputLabelProps={{ shrink: true }} fullWidth value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField type="date" label={t('diligences.end')} InputLabelProps={{ shrink: true }} fullWidth value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <TextField label={t('diligences.description')} value={desc} onChange={(e) => setDesc(e.target.value)} multiline rows={3} fullWidth />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSubmit}>{t('diligences.create')}</Button>
          </Grid>
        </Grid>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.type}>{toast.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}

export default DiligencesPage
