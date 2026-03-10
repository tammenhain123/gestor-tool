import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { getProject } from '../services/project.service'
import { Project } from '../types/project'
import CapacidadeForm from '../components/projects/CapacidadeForm'
import RequisitosForm from '../components/projects/RequisitosForm'
import QualificationForm from '../components/projects/QualificationForm'
import { useTranslation } from 'react-i18next'

const TabPanel: React.FC<{ children?: React.ReactNode; value: number; index: number }> = ({ children, value, index }) => {
  if (value !== index) return null
  return <Box sx={{ p: 2 }}>{children}</Box>
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [qualification, setQualification] = useState<any | null>(null)
  const [capacity, setCapacity] = useState<any | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [tab, setTab] = useState(0)

  const { t } = useTranslation()

  const [forms, setForms] = useState(Array.from({ length: 9 }, () => ({ text: '', file: null as File | null })))

  useEffect(() => {
    if (!id) return
    let mounted = true
    ;(async () => {
      try {
        const p = await getProject(id)
        try {
          const q = await (await import('../services/project.service')).getQualification(id)
          setQualification(q ?? null)
            try {
              const c = await (await import('../services/project.service')).getCapacity(id)
              setCapacity(c ?? null)
            } catch (e) {}
        } catch (e) {
          // ignore qualification load errors
        }
        if (!mounted) return
        setProject(p)
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const handleTabChange = (_: any, v: number) => setTab(v)

  const handleFormChange = (index: number, updates: Partial<{ text: string; file: File | null }>) => {
    setForms((prev) => {
      const next = prev.slice()
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  const handleSave = (index: number) => {
    const entry = forms[index]
    console.log('Save tab', index + 1, entry)
    alert(`Saved tab ${index + 1}`)
  }

  const tabLabels: string[] = t('projectDetail.tabs', { returnObjects: true }) as string[]

  if (loading) return <Box sx={{ p: 3 }}><Typography>{t('projectDetail.loading')}</Typography></Box>
  if (!project) return <Box sx={{ p: 3 }}><Typography>{t('projectDetail.projectNotFound')}</Typography></Box>

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, mb: 2 }}>
          <Box sx={{
          width: 240,
          height: 140,
          backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : undefined,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          bgcolor: project.imageUrl ? 'transparent' : 'grey.100',
          borderRadius: 2,
          boxShadow: 1,
          flexShrink: 0,
        }} aria-label={project.name}>
          {!project.imageUrl && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">{t('projectDetail.noImage')}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">{project.name}</Typography>
          <Typography variant="body2" color="text.secondary">{project.type} — {project.company?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{t('projectDetail.creator')} {project.creator?.username || project.creator?.id}</Typography>
        </Box>
      </Paper>

      <Paper>
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabLabels.map((lbl, i) => <Tab label={lbl} key={i} />)}
        </Tabs>

        {Array.from({ length: tabLabels.length }).map((_, i) => (
          <TabPanel value={tab} index={i} key={i}>
            {i === 0 ? (
              <QualificationForm initial={qualification ?? undefined} projectId={id} projectName={project?.name} onSave={async (data) => {
                try {
                  const saved = await (await import('../services/project.service')).saveQualification(id!, data)
                  setQualification(saved)
                  setToast({ type: 'success', message: 'Qualificação salva' })
                  return saved
                } catch (e) {
                  console.error(e)
                  setToast({ type: 'error', message: 'Erro ao salvar qualificação' })
                  throw e
                }
              }} />
            ) : i === 3 ? (
              <CapacidadeForm initial={capacity ?? undefined} projectId={id} projectName={project?.name} onSave={async (data) => {
                try {
                  // data is the saved resource returned by CapacidadeForm
                  console.log('Capacidade saved', data)
                  setToast({ type: 'success', message: 'Capacidade salva' })
                  // refresh capacity state
                  try {
                    const c = await (await import('../services/project.service')).getCapacity(id)
                    setCapacity(c ?? null)
                  } catch (e) {
                    // ignore
                  }
                } catch (e) {
                  console.error(e)
                  setToast({ type: 'error', message: 'Erro ao salvar capacidade' })
                }
                return data
              }} />
            ) : i === 4 ? (
              <RequisitosForm onSave={(data) => { console.log('Requisitos saved', data); alert('Requisitos salvos (simulado)') }} />
            ) : (
              <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(i) }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label={`Texto da aba ${i + 1}`} value={forms[i].text} onChange={(e) => handleFormChange(i, { text: e.target.value })} multiline />
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Button variant="outlined" component="label">Enviar documento<input type="file" hidden onChange={(e) => handleFormChange(i, { file: e.target.files?.[0] ?? null })} /></Button>
                  <Typography variant="body2">{forms[i].file ? forms[i].file.name : t('projectDetail.noFile')}</Typography>
                </Stack>
                <Box>
                  <Button type="submit" variant="contained">Salvar</Button>
                </Box>
              </Box>
            )}
          </TabPanel>
        ))}
        <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
          {toast ? <Alert severity={toast.type} onClose={() => setToast(null)}>{toast.message}</Alert> : null}
        </Snackbar>
      </Paper>
    </Box>
  )
}

export default ProjectDetail
