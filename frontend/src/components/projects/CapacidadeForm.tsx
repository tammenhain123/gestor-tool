import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import VisibilityIcon from '@mui/icons-material/Visibility'
import InfoIcon from '@mui/icons-material/Info'
import FilePreview from '../common/FilePreview'
import AddIcon from '@mui/icons-material/Add'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'

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

const CapacidadeForm: React.FC<Props> = ({ initial, onSave, projectId, projectName }) => {
  const [docs, setDocs] = useState(() => {
    if (Array.isArray(initial?.docs) && initial.docs.length > 0) return initial.docs.map((d: any) => ({ ...d, file: null, labelKey: undefined }))
    return docKeys.map((k) => ({ labelKey: `capacidade.docs.${k}`, file: null as File | null, validado: 'nao' as 'sim' | 'nao' }))
  });
  const projectIdToUse = projectId || initial?.projectId || undefined
  const { t } = useTranslation()
  const [bankEntries, setBankEntries] = useState<any[]>(() => (Array.isArray(initial?.bankEntries) && initial.bankEntries.length > 0 ? initial.bankEntries.map((b: any) => ({ ...b, file: null })) : [{ banco: '', numeroConta: '', agencia: '', ano: '', mes: '', file: null }]))
  const [bens, setBens] = useState(() => (Array.isArray(initial?.bens) && initial.bens.length > 0 ? initial.bens : [{ descricao: '', apresentacao: '', matricula: '', valorAtual: '' }]));
  const [ocupante, setOcupante] = useState(initial?.ocupante ?? { nome: '', cpfCnpj: '', telefone: '' });

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
    const payload = { docs, bens, ocupante, bankEntries }
    // If projectId provided, save to backend qualification (merge with existing)
    if (projectIdToUse) {
      try {
        const { getCapacity, saveCapacity } = await import('../../services/project.service')

        // Strip File objects before saving; we'll upload them to S3 after we have a capacity id
        const stripFiles = (p: any) => {
          const copy: any = { ...p }
          if (Array.isArray(copy.docs)) copy.docs = copy.docs.map((d: any) => ({ ...d, file: undefined }))
          if (Array.isArray(copy.bankEntries)) copy.bankEntries = copy.bankEntries.map((b: any) => ({ ...b, file: undefined }))
          return copy
        }

        const existing = await getCapacity(projectIdToUse)
        const merged = { ...(existing || {}), ...(stripFiles(payload)) }
        // create/update capacity first to obtain id
        const created = await saveCapacity(projectIdToUse, merged)
        const capacityId = created?.id || created?.capacityId || null

        // upload files (docs and bankEntries) and save metadata
        const { presign, saveMetadata } = await import('../../services/file.service')
        const tabName = 'Capacidade Estrutural e Financeira'

        const uploadOne = async (file: File) => {
          try {
            const p = await presign(projectIdToUse, file.name, projectName, tabName)
            const uploadRes = await fetch(p.url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
            if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`)
            const metaSaved = await saveMetadata(projectIdToUse, { key: p.key, originalName: file.name, mimeType: file.type, size: file.size, capacityId })
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
                const metaSaved = await saveMetadata(projectIdToUse, { key: json.key, originalName: file.name, mimeType: file.type, size: file.size, capacityId })
                return metaSaved
              }
            } catch (err2) {
              console.error('Both upload methods failed', err2)
            }
          }
          return null
        }

        // collect file upload promises
        const uploads: Promise<any>[] = []
        // docs
        for (const d of docs) {
          if (d?.file && d.file instanceof File) uploads.push(uploadOne(d.file))
        }
        // bank entries
        for (const b of bankEntries) {
          if (b?.file && b.file instanceof File) uploads.push(uploadOne(b.file))
        }

        const savedMetas = uploads.length ? (await Promise.all(uploads)).filter(Boolean) : []

        // Map saved metadata by originalName for quick lookup
        const metaByName = new Map(savedMetas.map((m: any) => [m.originalName, m]))

        // Prepare final payload including s3Key/originalName for docs and bankEntries
        const finalPayload = {
          ...(merged || {}),
          docs: (payload.docs || []).map((d: any) => ({
            ...d,
            file: undefined,
            s3Key: d.s3Key || d.key || (d.file ? (metaByName.get(d.file.name)?.s3Key || metaByName.get(d.file.name)?.key) : undefined),
            originalName: d.originalName || d.name || (d.file ? (metaByName.get(d.file.name)?.originalName) : undefined),
          })),
          bankEntries: (payload.bankEntries || []).map((b: any) => ({
            ...b,
            file: undefined,
            s3Key: b.s3Key || b.key || (b.file ? (metaByName.get(b.file.name)?.s3Key || metaByName.get(b.file.name)?.key) : undefined),
            originalName: b.originalName || b.name || (b.file ? (metaByName.get(b.file.name)?.originalName) : undefined),
          })),
        }

        // Save capacity again to persist docs/bankEntries to DB tables
        const finalSaved = await saveCapacity(projectIdToUse, finalPayload)
        const refreshed = await getCapacity(projectIdToUse)
        console.log('Capacidade salva no backend', refreshed)
        if (onSave) await onSave(refreshed)
        return
      } catch (e) {
        console.error('Erro ao salvar capacidade no backend', e)
        return
      }
    }

    if (onSave) onSave(payload)
    else alert('Capacidade salva (simulada)')
  }

  React.useEffect(() => {
    console.log('CapacidadeForm mounted', { projectId: projectIdToUse, projectName, initial })
    console.log('Initial docs/bankEntries/bens sample', { docs: docs.slice(0, 5), bankEntries: bankEntries.slice(0, 5), bens: bens.slice(0, 5) })
  }, [])

  // synchronize internal state when `initial` is updated from parent
  React.useEffect(() => {
    if (!initial) return
    try {
      // Only replace docs if initial provides a non-empty array; otherwise keep defaults
      if (Array.isArray(initial.docs) && initial.docs.length > 0) {
        setDocs(initial.docs.map((d: any, i: number) => ({
          ...d,
          file: null,
          labelKey: d.labelKey ? d.labelKey : `capacidade.docs.${(docKeys[i] || 'doc' + i)}`
        })))
      } else {
        // ensure defaults if initial.docs is absent or empty
        setDocs(docKeys.map((k) => ({ labelKey: `capacidade.docs.${k}`, file: null as File | null, validado: 'nao' as 'sim' | 'nao' })))
      }

      if (Array.isArray(initial.bankEntries) && initial.bankEntries.length > 0) {
        setBankEntries(initial.bankEntries.map((b: any) => ({ ...b, file: null })))
      } else {
        setBankEntries([{ banco: '', numeroConta: '', agencia: '', ano: '', mes: '', file: null }])
      }

      if (Array.isArray(initial.bens) && initial.bens.length > 0) setBens(initial.bens)
      if (initial.ocupante) setOcupante(initial.ocupante)
    } catch (e) {
      console.warn('Failed to sync initial capacity state', e)
    }
  }, [initial])

  return (
    <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{t('capacidade.title')}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Box>
              <Typography variant="subtitle1">{t('capacidade.bankData')}</Typography>
              {bankEntries.map((be, idx) => (
                <Grid container spacing={1} key={`bank-${idx}`} alignItems="center" sx={{ mt: 1 }}>
                  <Grid item xs={12} md={3}>
                    <TextField label={t('capacidade.bank.banco')} fullWidth value={be.banco || ''} onChange={(e) => setBankEntries((p) => { const copy = [...p]; copy[idx] = { ...copy[idx], banco: e.target.value }; return copy })} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                        <TextField label={t('capacidade.bank.numeroConta')} fullWidth value={be.numeroConta || ''} onChange={(e) => setBankEntries((p) => { const copy = [...p]; copy[idx] = { ...copy[idx], numeroConta: e.target.value }; return copy })} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                        <TextField label={t('capacidade.bank.agencia')} fullWidth value={be.agencia || ''} onChange={(e) => setBankEntries((p) => { const copy = [...p]; copy[idx] = { ...copy[idx], agencia: e.target.value }; return copy })} />
                  </Grid>
                  <Grid item xs={12} md={1}>
                        <TextField label={t('capacidade.bank.ano')} fullWidth value={be.ano || ''} onChange={(e) => setBankEntries((p) => { const copy = [...p]; copy[idx] = { ...copy[idx], ano: e.target.value }; return copy })} />
                  </Grid>
                  <Grid item xs={12} md={1}>
                        <TextField label={t('capacidade.bank.mes')} fullWidth value={be.mes || ''} onChange={(e) => setBankEntries((p) => { const copy = [...p]; copy[idx] = { ...copy[idx], mes: e.target.value }; return copy })} />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" component="label">{t('capacidade.attachBank')}
                        <input type="file" hidden onChange={(e) => setBankEntries((p) => { const copy = [...p]; copy[idx] = { ...copy[idx], file: e.target.files?.[0] ?? null }; return copy })} />
                      </Button>
                      <FilePreview projectId={projectIdToUse || projectId} file={be.file} fileName={be.file?.name || be.originalName || null} s3Key={(be as any).s3Key || (be as any).key || null} />
                        <Tooltip title={( () => {
                          try {
                            const uploader = (be.uploadedBy || (be.meta && typeof be.meta === 'object' ? be.meta.uploadedBy : undefined) || 'Desconhecido')
                            const date = be.createdAt ? new Date(be.createdAt).toLocaleString() : ''
                            return `${uploader}${date ? ' — ' + date : ''}`
                          } catch (e) {
                            return 'Informações do arquivo'
                          }
                        })()}>
                          <IconButton aria-label="Informações" sx={{ color: 'primary.main' }}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>
              ))}
              <Box sx={{ mt: 1 }}>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setBankEntries((p) => [...p, { banco: '', numeroConta: '', agencia: '', ano: '', mes: '', file: null }])}>{t('capacidade.addBank')}</Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {docs.map((d, i) => {
          if ((d.labelKey || '').toString() === 'capacidade.docs.extrato') return null
          return (
            <Grid item xs={12} key={`${d.labelKey || d.label || i}`}>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={4}>
                        <Typography>{d.labelKey ? t(String(d.labelKey)) : (d.label || '')}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button variant="outlined" component="label">{t('capacidade.attach')}<input type="file" hidden onChange={(e) => setDoc(i, { file: e.target.files?.[0] ?? null })} /></Button>
                    <FilePreview projectId={projectIdToUse || projectId} file={d.file} fileName={d.file?.name || d.originalName || null} s3Key={(d as any).s3Key || (d as any).key || null} />
                    { (d.s3Key || d.key) ? (
                      <Tooltip title={( () => {
                        try {
                          let metaObj = d.meta
                          if (typeof metaObj === 'string' && metaObj) metaObj = JSON.parse(metaObj)
                          const uploader = d.uploadedBy || (metaObj && metaObj.uploadedBy) || 'Desconhecido'
                          const dateSource = d.createdAt || (metaObj && metaObj.createdAt)
                          const date = dateSource ? new Date(dateSource).toLocaleString() : ''
                          return `${uploader}${date ? ' — ' + date : ''}`
                        } catch (e) {
                          return 'Informações do arquivo'
                        }
                      })()}>
                        <IconButton aria-label="Informações" sx={{ color: 'primary.main' }}>
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null }
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      <Typography variant="h6">{t('capacidade.bensTitle')}</Typography>
      <Grid container spacing={2}>
        {bens.map((b, i) => (
          <React.Fragment key={i}>
                <Grid item xs={12} md={6}>
            <TextField label={t('capacidade.bem.descricao')} fullWidth value={b.descricao || ''} onChange={(e) => setBem(i, { descricao: e.target.value })} multiline rows={2} />
              </Grid>
            <Grid item xs={12} md={3}>
              <TextField label={t('capacidade.bem.matricula')} fullWidth value={b.matricula || ''} onChange={(e) => setBem(i, { matricula: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label={t('capacidade.bem.valorAtual')} fullWidth value={b.valorAtual || ''} onChange={(e) => setBem(i, { valorAtual: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label={t('capacidade.bem.apresentacao')} fullWidth value={b.apresentacao || ''} onChange={(e) => setBem(i, { apresentacao: e.target.value })} multiline rows={3} />
            </Grid>
          </React.Fragment>
        ))}
        <Grid item>
          <Button variant="text" onClick={addBem}>{t('capacidade.bem.addNew')}</Button>
        </Grid>
      </Grid>

      <Typography variant="h6">{t('capacidade.ocupante.title')}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField label={t('capacidade.ocupante.nome')} fullWidth value={ocupante.nome || ''} onChange={(e) => setOcupante((p) => ({ ...p, nome: e.target.value }))} />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField label={t('capacidade.ocupante.cpfCnpj')} fullWidth value={ocupante.cpfCnpj || ''} onChange={(e) => setOcupante((p) => ({ ...p, cpfCnpj: e.target.value }))} />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField label={t('capacidade.ocupante.telefone')} fullWidth value={ocupante.telefone || ''} onChange={(e) => setOcupante((p) => ({ ...p, telefone: e.target.value }))} />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained">{t('capacidade.saveButton')}</Button>
      </Box>
    </Box>
  )
}

export default CapacidadeForm
