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
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
import Checkbox from '@mui/material/Checkbox'
import FilePreview from '../common/FilePreview'

type Props = {
  initial?: any
  onSave?: (data: any) => void
  projectId?: string
  projectName?: string
}

const docKeys = [
  'extrato',
  'organograma',
  'endividamento',
  'recebiveis',
  'estoque',
  'ativo',
  'aluguels_recebiveis'
]

const EstrategiaForm: React.FC<Props> = ({ initial, onSave, projectId, projectName }) => {
  const { t } = useTranslation()

  const projectIdToUse = projectId || initial?.projectId || undefined
  const { user } = useAuth()
  const isReadOnly = String(user?.role || '').toUpperCase() === 'USER'

  const [notes, setNotes] = useState<string>(() => initial?.notes || '')
  const [docs, setDocs] = useState<Array<any>>(() => {
    if (Array.isArray(initial?.docs) && initial.docs.length > 0) return initial.docs.map((d: any, i: number) => ({ ...d, file: null, labelKey: d.labelKey ? d.labelKey : `capacidade.docs.${(docKeys[i] || 'doc' + i)}` }))
    return docKeys.map((k) => ({ labelKey: `capacidade.docs.${k}`, file: null as File | null, validado: 'nao' as 'sim' | 'nao' }))
  })

  const [bens, setBens] = useState(() => (Array.isArray(initial?.bens) && initial.bens.length > 0 ? initial.bens : [{ descricao: '', apresentacao: '', matricula: '', valorAtual: '' }]))
  const [ocupante, setOcupante] = useState(initial?.ocupante ?? { nome: '', cpfCnpj: '', telefone: '' })

  const setDoc = (index: number, patch: Partial<{ file: File | null; validado: 'sim' | 'nao' }>) => {
    setDocs((prev) => {
      const next = prev.slice()
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const setBem = (index: number, patch: Partial<{ descricao: string; apresentacao: string; matricula: string; valorAtual: string }>) => {
    setBens((prev) => {
      const next = prev.slice()
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const addBem = () => setBens((prev) => [...prev, { descricao: '', apresentacao: '', matricula: '', valorAtual: '' }])

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const payload = { notes, docs, bens, ocupante }

    const stripFiles = (p: any) => {
      const copy: any = { ...p }
      if (Array.isArray(copy.docs)) {
        copy.docs = copy.docs.map((d: any) => ({
          ...d,
          file: undefined,
          originalName: d.originalName || (d.file ? d.file.name : undefined),
        }))
      }
      return copy
    }

    // If projectId available, perform presign -> upload -> saveMetadata flow like other forms
    if (projectIdToUse) {
      try {
        const { getStrategy, saveStrategy } = await import('../../services/project.service')
        const existing = await getStrategy(projectIdToUse)
        const existingData = existing?.data || {}
        const merged = { ...existingData, ...stripFiles(payload) }

        // ensure server-side record exists
        await saveStrategy(projectIdToUse, merged)

        const { presign, saveMetadata } = await import('../../services/file.service')
        const tabName = 'Strategy & Procedure'

        const uploadOne = async (file: File) => {
          try {
            const p = await presign(projectIdToUse, file.name, projectName, tabName)
            const uploadRes = await fetch(p.url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
            if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`)
            const metaSaved = await saveMetadata(projectIdToUse, { key: p.key, originalName: file.name, mimeType: file.type, size: file.size })
            return metaSaved
          } catch (err) {
            // fallback to backend upload
            try {
              const fd = new FormData()
              fd.append('file', file)
              if (projectName) fd.append('projectName', projectName)
              fd.append('tabName', tabName)
              const uploadResp = await fetch(`/api/projects/${projectIdToUse}/files`, { method: 'POST', body: fd })
              if (!uploadResp.ok) throw new Error('Backend upload failed')
              const json = await uploadResp.json()
              if (json && json.key) {
                const metaSaved = await saveMetadata(projectIdToUse, { key: json.key, originalName: file.name, mimeType: file.type, size: file.size })
                return metaSaved
              }
            } catch (err2) {
              console.error('Both upload methods failed', err2)
            }
          }
          return null
        }

        // upload files
        const uploads: Promise<any>[] = []
        for (const d of docs) {
          if (d?.file && d.file instanceof File) uploads.push(uploadOne(d.file))
        }

        const savedMetas = uploads.length ? (await Promise.all(uploads)).filter(Boolean) : []
        const metaByName = new Map(savedMetas.map((m: any) => [m.originalName, m]))

        const finalPayload = {
          ...(merged || {}),
          notes,
          docs: (payload.docs || []).map((d: any) => ({
            ...d,
            file: undefined,
            s3Key: d.s3Key || d.key || (d.file ? (metaByName.get(d.file.name)?.s3Key || metaByName.get(d.file.name)?.key) : undefined),
            originalName: d.originalName || d.name || (d.file ? (metaByName.get(d.file.name)?.originalName) : undefined),
          })),
          bens,
          ocupante,
        }

        const saved = await saveStrategy(projectIdToUse, finalPayload)
        if (onSave) await onSave(saved)
        return
      } catch (e) {
        console.error('Erro ao salvar estratégia no backend', e)
        if (onSave) {
          // forward error
          await onSave(stripFiles(payload))
          return
        }
        return
      }
    }

    if (onSave) {
      await onSave(stripFiles(payload))
      return
    }
    alert('Estratégia salva (simulada)')
  }

  React.useEffect(() => {
    console.log('EstrategiaForm mounted', { projectId: projectIdToUse, projectName, initial })
  }, [])

  React.useEffect(() => {
    if (!initial) return
    try {
      if (Array.isArray(initial.docs) && initial.docs.length > 0) {
        setDocs(initial.docs.map((d: any, i: number) => ({ ...d, file: null, labelKey: d.labelKey ? d.labelKey : `capacidade.docs.${(docKeys[i] || 'doc' + i)}` })))
      }
      if (Array.isArray(initial.bens) && initial.bens.length > 0) setBens(initial.bens)
      if (initial.ocupante) setOcupante(initial.ocupante)
    } catch (e) {
      console.warn('Failed to sync initial estrategia state', e)
    }
  }, [initial])

  return (
    <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{t('estrategia.title')}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <TextField disabled={isReadOnly} label={t('estrategia.notes')} fullWidth multiline rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Typography variant="subtitle1">{t('estrategia.docsTitle')}</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {docs.map((d, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1, borderColor: 'divider', borderWidth: 1, borderStyle: 'solid', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ minWidth: 360, flexShrink: 0 }}>
                      <Typography>{d.labelKey ? t(String(d.labelKey)) : (d.label || '')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button disabled={isReadOnly} variant="contained" color="primary" component="label" sx={{ whiteSpace: 'nowrap', minWidth: 96, color: '#ffffff' }}>{t('estrategia.attach')}
                        <input type="file" hidden onChange={(e) => { if (!isReadOnly) setDoc(idx, { file: e.target.files?.[0] ?? null }) }} />
                      </Button>
                      <Checkbox
                        checked={!!(d.file || d.originalName || (d as any).s3Key || (d as any).key)}
                        onClick={(e) => e.preventDefault()}
                        sx={{
                          '&.Mui-checked': { color: (theme: any) => theme.palette.success.main },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                      <FilePreview projectId={projectIdToUse || projectId} file={d.file} fileName={d.file?.name || d.originalName || null} s3Key={(d as any).s3Key || (d as any).key || null} />
                      <Tooltip title={(() => {
                        try {
                          const uploader = (d.uploadedBy || (d.meta && typeof d.meta === 'object' ? d.meta.uploadedBy : undefined) || 'Desconhecido')
                          const date = d.createdAt ? new Date(d.createdAt).toLocaleString() : ''
                          return `${uploader}${date ? ' — ' + date : ''}`
                        } catch (e) { return 'Informações do arquivo' }
                      })()}>
                        <IconButton aria-label="Informações" sx={{ color: 'primary.main', p: 0.5, '& .MuiSvgIcon-root': { fontSize: 20 } }}>
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">{t('capacidade.bensTitle')}</Typography>
          <Grid container spacing={2}>
            {bens.map((b, i) => (
              <React.Fragment key={i}>
                <Grid item xs={12} md={6}>
                  <TextField disabled={isReadOnly} label={t('capacidade.bem.descricao')} fullWidth value={b.descricao || ''} onChange={(e) => setBem(i, { descricao: e.target.value })} multiline rows={2} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField disabled={isReadOnly} label={t('capacidade.bem.matricula')} fullWidth value={b.matricula || ''} onChange={(e) => setBem(i, { matricula: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField disabled={isReadOnly} label={t('capacidade.bem.valorAtual')} fullWidth value={b.valorAtual || ''} onChange={(e) => setBem(i, { valorAtual: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField disabled={isReadOnly} label={t('capacidade.bem.apresentacao')} fullWidth value={b.apresentacao || ''} onChange={(e) => setBem(i, { apresentacao: e.target.value })} multiline rows={3} />
                </Grid>
              </React.Fragment>
            ))}
            <Grid item>
              <Button disabled={isReadOnly} variant="text" startIcon={<AddIcon />} onClick={addBem}>{t('capacidade.bem.addNew')}</Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">{t('capacidade.ocupante.title')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField disabled={isReadOnly} label={t('capacidade.ocupante.nome')} fullWidth value={ocupante.nome || ''} onChange={(e) => setOcupante((p) => ({ ...p, nome: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField disabled={isReadOnly} label={t('capacidade.ocupante.cpfCnpj')} fullWidth value={ocupante.cpfCnpj || ''} onChange={(e) => setOcupante((p) => ({ ...p, cpfCnpj: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField disabled={isReadOnly} label={t('capacidade.ocupante.telefone')} fullWidth value={ocupante.telefone || ''} onChange={(e) => setOcupante((p) => ({ ...p, telefone: e.target.value }))} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Box>
        <Button disabled={isReadOnly} type="submit" variant="contained">{t('estrategia.saveButton')}</Button>
      </Box>
    </Box>
  )
}

export default EstrategiaForm
