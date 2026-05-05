import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import InfoIcon from '@mui/icons-material/Info'
import FilePreview from '../common/FilePreview'
import { presign, saveMetadata } from '../../services/file.service'

type Props = {
  initial?: any
  onSave?: (data: any) => void
  projectId?: string
  projectName?: string
}

const IndicadoresForm: React.FC<Props> = ({ initial, onSave, projectId, projectName }) => {
  const { t } = useTranslation()
  const [reports, setReports] = useState(() => (Array.isArray(initial?.reports) && initial.reports.length > 0 ? initial.reports.map((r: any) => ({ ...r, file: null })) : [{ key: 'vendas_por_cliente', label: 'Relatório de vendas por clientes', descricao: '', date: '', file: null }]))

  const setReport = (i: number, patch: any) => setReports((prev) => { const next = prev.slice(); next[i] = { ...next[i], ...patch }; return next })

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    // normalize reports to include single `date` field
    const payload = { reports: reports.map((r: any) => ({ ...r, date: r.date || r.startDate || r.endDate || null })) }
    if (projectId) {
      try {
        const tabName = t('indicadores.title')
        const uploads: Promise<any>[] = []
        for (const r of reports) {
          if (r?.file && r.file instanceof File) {
            const field = r.key || r.label
            try {
              const p = await presign(projectId, r.file.name, projectName, tabName, field)
              const uploadRes = await fetch(p.url, { method: 'PUT', headers: { 'Content-Type': r.file.type || 'application/octet-stream' }, body: r.file })
              if (!uploadRes.ok) throw new Error('S3 upload failed')
              const meta = await saveMetadata(projectId, { key: p.key, originalName: r.file.name, mimeType: r.file.type, size: r.file.size, labelKey: field })
              uploads.push(Promise.resolve(meta))
            } catch (e) {
              // fallback: backend upload
              try {
                const fd = new FormData()
                fd.append('file', r.file)
                if (projectName) fd.append('projectName', projectName)
                fd.append('tabName', tabName)
                fd.append('fieldName', field)
                const uploadResp = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: fd })
                const json = await uploadResp.json()
                if (json && json.key) {
                  const metaSaved = await saveMetadata(projectId, { key: json.key, originalName: r.file.name, mimeType: r.file.type, size: r.file.size, labelKey: field })
                  uploads.push(Promise.resolve(metaSaved))
                }
              } catch (e2) { console.error('upload failed', e2) }
            }
          }
        }
        const saved = uploads.length ? (await Promise.all(uploads)).filter(Boolean) : []
        // merge metadata into payload
        const metaByName = new Map(saved.map((m: any) => [m.originalName, m]))
        const final = { reports: reports.map((r: any) => ({ ...r, file: undefined, date: r.date || r.startDate || r.endDate || null, s3Key: r.s3Key || (r.file ? (metaByName.get(r.file.name)?.s3Key || metaByName.get(r.file.name)?.key) : undefined), originalName: r.originalName || (r.file ? (metaByName.get(r.file.name)?.originalName) : undefined) })) }
        if (onSave) await onSave(final)
        // persist to backend indicators endpoint
        try {
          const { saveIndicators } = await import('../../services/project.service')
          await saveIndicators(projectId, final)
        } catch (e) {
          console.warn('Failed to persist indicadores to backend', e)
        }
        return
      } catch (e) {
        console.error('Erro ao salvar indicadores', e)
        if (onSave) await onSave(payload)
        return
      }
    }
    if (onSave) await onSave(payload)
  }

  useEffect(() => {
    const applyInitialReports = async () => {
      try {
        let files: any[] = []
        if (projectId) {
          const { list } = await import('../../services/file.service')
          files = await list(projectId)
        }

        if (Array.isArray(initial?.reports) && initial.reports.length > 0) {
          setReports(initial.reports.map((r: any) => {
            const labelKey = r.labelKey || r.key || r.label
            // prefer files with same labelKey
            let match: any = null
            try {
              const byLabel = files.filter((f) => f.labelKey === labelKey)
              if (byLabel.length > 0) {
                byLabel.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
                match = byLabel[0]
              } else {
                const byName = files.filter((f) => f.originalName === r.originalName)
                if (byName.length > 0) {
                  byName.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
                  match = byName[0]
                } else {
                  match = files.find((f) => f.s3Key === r.s3Key)
                }
              }
            } catch (e) {
              console.warn('Error matching indicadores files', e)
            }

            return { ...r, file: null, labelKey, s3Key: match?.s3Key || r.s3Key, originalName: match?.originalName || r.originalName, createdAt: match?.createdAt || r.createdAt, uploadedBy: match?.uploadedBy || r.uploadedBy }
          }))
          return
        }

        // autodiscover saved indicadores files if no initial provided
        if (files.length > 0) {
          const discovered = files.filter((f) => String(f.labelKey || '').startsWith('vendas') || String(f.labelKey || '').includes('indicadores') )
          if (discovered.length > 0) {
            const mapped = discovered.map((f: any, idx: number) => ({ key: f.labelKey || `report_${idx}`, label: f.labelKey || f.originalName || `Relatório ${idx + 1}`, descricao: '', date: '', file: null, s3Key: f.s3Key || f.key, originalName: f.originalName, createdAt: f.createdAt, uploadedBy: f.uploadedBy, labelKey: f.labelKey }))
            setReports(mapped)
          }
        }
      } catch (e) {
        console.warn('Failed to map indicadores files', e)
      }
    }

    void applyInitialReports()
  }, [initial, projectId])

  return (
    <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{t('indicadores.title')}</Typography>
      <Stack spacing={2}>
        {reports.map((r: any, i: number) => (
          <Paper key={i} variant="outlined" sx={{ p: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField label={t('indicadores.descricao')} fullWidth value={r.descricao || ''} onChange={(e) => setReport(i, { descricao: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField type="date" label={t('indicadores.date')} InputLabelProps={{ shrink: true }} fullWidth value={r.date || ''} onChange={(e) => setReport(i, { date: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button variant="outlined" component="label">{t('indicadores.attach')}
                    <input type="file" hidden onChange={(e) => setReport(i, { file: e.target.files?.[0] ?? null })} />
                  </Button>
                  <Box sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Typography variant="body2">{r.file?.name || r.originalName || ''}</Typography></Box>
                  <Checkbox checked={!!(r.file || r.originalName || r.s3Key)} onClick={(e) => e.preventDefault()} sx={{ '&.Mui-checked': { color: (theme: any) => theme.palette.success.main } }} />
                  <FilePreview projectId={projectId} file={r.file} fileName={r.file?.name || r.originalName || null} s3Key={r.s3Key || r.key || null} />
                  <Tooltip title={t('file.info')}>
                    <IconButton sx={{ color: 'primary.main' }}><InfoIcon fontSize="small"/></IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        ))}
        <Button variant="text" onClick={() => setReports((p) => [...p, { key: `report_${p.length}`, label: '', descricao: '', date: '', file: null }])}>{t('indicadores.addReport')}</Button>
      </Stack>
      <Box sx={{ mt: 2 }}>
        <Button type="submit" variant="contained">{t('indicadores.saveButton')}</Button>
      </Box>
    </Box>
  )
}

export default IndicadoresForm
