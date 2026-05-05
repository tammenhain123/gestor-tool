import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Checkbox from '@mui/material/Checkbox'
import FilePreview from '../common/FilePreview'
import { presign, saveMetadata } from '../../services/file.service'

type Props = {
  initial?: any
  onSave?: (data: any) => void
  projectId?: string
  projectName?: string
}

const topDocsKeys = ['organograma', 'apresentacao']
const financeDocsKeys = ['balanco', 'dre', 'dmpl', 'dfc', 'relatorio_auditoria', 'plano_contas', 'faturamento']

const AvaliacaoCenarioForm: React.FC<Props> = ({ initial, onSave, projectId, projectName }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isReadOnly = String(user?.role || '').toUpperCase() === 'USER'

  const [topDocs, setTopDocs] = useState(() => {
    if (Array.isArray(initial?.topDocs) && initial.topDocs.length > 0) return initial.topDocs.map((d: any, i: number) => ({ ...d, file: null, reportDate: d.reportDate || d.date || null, labelKey: `avaliacao.docs.${topDocsKeys[i] || 'doc' + i}` }))
    return topDocsKeys.map((k) => ({ labelKey: `avaliacao.docs.${k}`, file: null as File | null, reportDate: null }))
  })

  const [years, setYears] = useState(() => {
    if (Array.isArray(initial?.years) && initial.years.length > 0) return initial.years
    return [ { year: '', docs: financeDocsKeys.map(k => ({ labelKey: `avaliacao.finance.${k}`, file: null as File | null, reportDate: null })) } ]
  })

  const setTopDoc = (index: number, patch: Partial<{ file: File | null; reportDate?: string | null }>) => {
    setTopDocs((prev) => {
      const next = prev.slice()
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const setYear = (index: number, patch: Partial<{ year: string; docs?: any[] }>) => {
    setYears((prev) => {
      const next = prev.slice()
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const addYear = () => setYears((prev) => [...prev, { year: '', docs: financeDocsKeys.map(k => ({ labelKey: `avaliacao.finance.${k}`, file: null as File | null, reportDate: null })) }])

  React.useEffect(() => {
    const applyInitialDocs = async () => {
      let files: any[] = []
      try {
        if (projectId) {
          const mod = await import('../../services/file.service')
          files = await mod.list(projectId)
        }
      } catch (e) {
        console.warn('Failed to list project files for mapping docs', e)
      }

      try {
        // If initial provided and contains structured docs/years, prefer mapping from it
        if (initial && Array.isArray(initial.topDocs) && initial.topDocs.length > 0) {
          setTopDocs(initial.topDocs.map((d: any, i: number) => {
            const labelKey = d.labelKey ? d.labelKey : `avaliacao.docs.${topDocsKeys[i] || 'doc' + i}`
            let match: any = null
            try {
              const byLabel = files.filter((f) => f.labelKey === labelKey)
              if (byLabel.length > 0) {
                byLabel.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
                match = byLabel[0]
              } else {
                const byName = files.filter((f) => f.originalName === d.originalName)
                if (byName.length > 0) {
                  byName.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
                  match = byName[0]
                } else {
                  match = files.find((f) => f.s3Key === d.s3Key)
                }
              }
            } catch (e) {
              console.warn('Error matching files for labelKey', labelKey, e)
            }
            return { ...d, file: null, labelKey, s3Key: match?.s3Key || d.s3Key, originalName: match?.originalName || d.originalName || (d.file ? d.file.name : undefined), createdAt: match?.createdAt || d.createdAt, uploadedBy: match?.uploadedBy || d.uploadedBy }
          }))
        } else {
          // No initial: attempt to autodiscover topDocs by labelKey
          const discoveredTop = topDocsKeys.map((k) => {
            const lk = `avaliacao.docs.${k}`
            const byLabel = files.filter((f) => f.labelKey === lk)
            let match = null
            if (byLabel.length > 0) {
              byLabel.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
              match = byLabel[0]
            }
            return { labelKey: lk, file: null as File | null, reportDate: match?.reportDate || null, s3Key: match?.s3Key, originalName: match?.originalName }
          })
          setTopDocs(discoveredTop)
        }

        if (initial && Array.isArray(initial.years) && initial.years.length > 0) {
          setYears(initial.years.map((y: any) => ({
            year: y.year,
            docs: Array.isArray(y.docs) ? y.docs.map((d: any, i: number) => {
              const labelKey = d.labelKey ? d.labelKey : `avaliacao.finance.${financeDocsKeys[i] || 'doc' + i}`
              let match: any = null
              try {
                const byLabel = files.filter((f) => f.labelKey === labelKey)
                if (byLabel.length > 0) {
                  byLabel.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
                  match = byLabel[0]
                } else {
                  const byName = files.filter((f) => f.originalName === d.originalName)
                  if (byName.length > 0) {
                    byName.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
                    match = byName[0]
                  } else {
                    match = files.find((f) => f.s3Key === d.s3Key)
                  }
                }
              } catch (e) {
                console.warn('Error matching files for labelKey', labelKey, e)
              }
              return { ...d, file: null, reportDate: d.reportDate || d.date || null, labelKey, s3Key: match?.s3Key || d.s3Key, originalName: match?.originalName || d.originalName || (d.file ? d.file.name : undefined), createdAt: match?.createdAt || d.createdAt, uploadedBy: match?.uploadedBy || d.uploadedBy }
            }) : financeDocsKeys.map((k) => ({ labelKey: `avaliacao.finance.${k}`, file: null, reportDate: null }))
          })))
        } else {
          // No initial years: attempt to populate a single year from any avaliacao.finance.* files
          const financeFiles = files.filter((f) => typeof f.labelKey === 'string' && f.labelKey.startsWith('avaliacao.finance.'))
          if (financeFiles.length > 0) {
            const docsForYear = financeDocsKeys.map((k) => {
              const lk = `avaliacao.finance.${k}`
              const byLabel = financeFiles.filter((f) => f.labelKey === lk)
              let match = null
              if (byLabel.length > 0) {
                byLabel.sort((a, b) => (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()))
                match = byLabel[0]
              }
                return { labelKey: lk, file: null as File | null, reportDate: match?.reportDate || null, s3Key: match?.s3Key, originalName: match?.originalName }
            })
            setYears([{ year: '', docs: docsForYear }])
          }
        }
      } catch (e) {
        console.warn('Failed to sync initial avaliacao state', e)
      }
    }

    void applyInitialDocs()
  }, [initial, projectId])

    React.useEffect(() => {
      console.log('AvaliacaoCenarioForm mounted', { projectId, projectName, initial, topDocs, years })
    }, [])

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const payload = { topDocs, years }

      const stripFiles = (p: any) => {
      const copy: any = { ...p }
      if (Array.isArray(copy.topDocs)) copy.topDocs = copy.topDocs.map((d: any) => ({ ...d, file: undefined, reportDate: d.reportDate || d.date || undefined, originalName: d.originalName || (d.file ? d.file.name : undefined) }))
      if (Array.isArray(copy.years)) copy.years = copy.years.map((y: any) => ({ ...y, docs: Array.isArray(y.docs) ? y.docs.map((d: any) => ({ ...d, file: undefined, reportDate: d.reportDate || d.date || undefined, originalName: d.originalName || (d.file ? d.file.name : undefined) })) : [] }))
      return copy
    }

    if (projectId) {
      try {
        const tabName = t('avaliacao.title')

        const uploadOne = async (file: File, docObj: any) => {
          try {
            const fieldName = docObj?.labelKey || docObj?.label || undefined
            const p = await presign(projectId, file.name, projectName, tabName, fieldName)
            const uploadRes = await fetch(p.url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
            if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`)
            // save metadata
            const meta = await saveMetadata(projectId, { key: p.key, originalName: file.name, mimeType: file.type, size: file.size, labelKey: fieldName })
            return meta
          } catch (err) {
            // fallback to backend upload
            try {
              const fd = new FormData()
              fd.append('file', file)
              if (projectName) fd.append('projectName', projectName)
              fd.append('tabName', tabName)
              if (docObj?.labelKey || docObj?.label) fd.append('fieldName', (docObj?.labelKey || docObj?.label))
              const uploadResp = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: fd })
              if (!uploadResp.ok) throw new Error('Backend upload failed')
              const json = await uploadResp.json()
              if (json && json.key) {
                const metaSaved = await saveMetadata(projectId, { key: json.key, originalName: file.name, mimeType: file.type, size: file.size, labelKey: docObj?.labelKey })
                return metaSaved
              }
            } catch (err2) {
              console.error('Both upload methods failed', err2)
            }
          }
          return null
        }

        const uploads: Promise<any>[] = []
        // topDocs
        for (const d of topDocs) {
          if (d?.file && d.file instanceof File) uploads.push(uploadOne(d.file, d))
        }
        // years docs
        for (const y of years) {
          if (Array.isArray(y.docs)) {
            for (const d of y.docs) {
              if (d?.file && d.file instanceof File) uploads.push(uploadOne(d.file, d))
            }
          }
        }

        const savedMetas = uploads.length ? (await Promise.all(uploads)).filter(Boolean) : []

        // Merge saved metadata into final payload structure
        const metaByOriginal = new Map(savedMetas.map((m: any) => [m.originalName, m]))

        const finalPayload = {
          topDocs: (payload.topDocs || []).map((d: any) => ({
            ...d,
            file: undefined,
            reportDate: d.reportDate || d.date || undefined,
            s3Key: d.s3Key || (d.file ? (metaByOriginal.get(d.file.name)?.s3Key || metaByOriginal.get(d.file.name)?.key) : undefined),
            originalName: d.originalName || d.name || (d.file ? (metaByOriginal.get(d.file.name)?.originalName) : undefined),
          })),
          years: (payload.years || []).map((y: any) => ({
            year: y.year,
            docs: (y.docs || []).map((d: any) => ({
              ...d,
              file: undefined,
              reportDate: d.reportDate || d.date || undefined,
              s3Key: d.s3Key || (d.file ? (metaByOriginal.get(d.file.name)?.s3Key || metaByOriginal.get(d.file.name)?.key) : undefined),
              originalName: d.originalName || d.name || (d.file ? (metaByOriginal.get(d.file.name)?.originalName) : undefined),
            }))
          }))
        }

        if (onSave) await onSave(finalPayload)
        return
      } catch (e) {
        console.error('Erro ao salvar avaliação', e)
        if (onSave) await onSave(stripFiles(payload))
        return
      }
    }

    if (onSave) {
      await onSave(stripFiles(payload))
      return
    }
    alert(t('avaliacao.savedSimulated'))
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{t('avaliacao.title')}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Typography variant="subtitle1">{t('avaliacao.docsTitle')}</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {topDocs.map((d, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1, borderColor: 'divider', borderWidth: 1, borderStyle: 'solid', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ minWidth: 360, flexShrink: 0 }}>
                      <Typography>{d.labelKey ? t(String(d.labelKey)) : (d.label || '')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button disabled={isReadOnly} variant="contained" color="primary" component="label" sx={{ whiteSpace: 'nowrap', minWidth: 96, color: '#ffffff' }}>{t('avaliacao.attach')}
                        <input type="file" hidden onChange={(e) => { if (!isReadOnly) setTopDoc(idx, { file: e.target.files?.[0] ?? null }) }} />
                      </Button>
                      <Box sx={{ ml: 1, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Typography variant="body2">{d.file?.name || (d as any).originalName || ''}</Typography>
                      </Box>
                      <TextField
                        type="date"
                        size="small"
                        value={d.reportDate || ''}
                        onChange={(e) => setTopDoc(idx, { reportDate: e.target.value })}
                        sx={{ maxWidth: 160 }}
                      />
                      <Checkbox checked={!!(d.file || (d as any).originalName || (d as any).s3Key || (d as any).key)} onClick={(e) => e.preventDefault()} sx={{ '&.Mui-checked': { color: (theme: any) => theme.palette.success.main }, '& .MuiSvgIcon-root': { fontSize: 20 } }} />
                      <FilePreview projectId={projectId} file={d.file} fileName={d.file?.name || d.originalName || null} s3Key={(d as any).s3Key || (d as any).key || null} />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Typography variant="subtitle1">{t('avaliacao.yearsTitle')}</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {years.map((y: any, yi: number) => (
                <Paper key={yi} variant="outlined" sx={{ p: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                      <TextField label={t('avaliacao.year')} fullWidth value={y.year || ''} onChange={(e) => setYear(yi, { year: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={10}>
                      <Stack spacing={1}>
                        {Array.isArray(y.docs) && y.docs.map((d: any, di: number) => (
                          <Paper key={di} variant="outlined" sx={{ p: 1 }}>
                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                              <Box sx={{ minWidth: 300, flexShrink: 0 }}>
                                <Typography>{d.labelKey ? t(String(d.labelKey)) : (d.label || '')}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button disabled={isReadOnly} variant="contained" color="primary" component="label" sx={{ whiteSpace: 'nowrap', minWidth: 96, color: '#ffffff' }}>{t('avaliacao.attach')}
                                  <input type="file" hidden onChange={(e) => { if (!isReadOnly) setYear(yi, { docs: y.docs.map((dd: any, k: number) => k === di ? { ...dd, file: e.target.files?.[0] ?? null } : dd) }) }} />
                                </Button>
                                <Box sx={{ ml: 1, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <Typography variant="body2">{d.file?.name || d.originalName || ''}</Typography>
                                </Box>
                                <TextField
                                  type="date"
                                  size="small"
                                  value={d.reportDate || ''}
                                  onChange={(e) => setYear(yi, { docs: y.docs.map((dd: any, k: number) => k === di ? { ...dd, reportDate: e.target.value } : dd) })}
                                  sx={{ maxWidth: 160 }}
                                />
                                <Checkbox checked={!!(d.file || d.originalName || d.s3Key || d.key)} onClick={(e) => e.preventDefault()} sx={{ '&.Mui-checked': { color: (theme: any) => theme.palette.success.main }, '& .MuiSvgIcon-root': { fontSize: 20 } }} />
                                <FilePreview projectId={projectId} file={d.file} fileName={d.file?.name || d.originalName || null} s3Key={d.s3Key || d.key || null} />
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Box>
                <Button variant="text" onClick={addYear}>{t('avaliacao.addYear')}</Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box>
        <Button disabled={isReadOnly} type="submit" variant="contained">{t('avaliacao.saveButton')}</Button>
      </Box>
    </Box>
  )
}

export default AvaliacaoCenarioForm
