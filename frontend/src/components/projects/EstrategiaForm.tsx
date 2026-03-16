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
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
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
    if (onSave) {
      await onSave(payload)
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
            <TextField label={t('estrategia.notes')} fullWidth multiline rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Typography variant="subtitle1">{t('estrategia.docsTitle')}</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {docs.map((d, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ minWidth: 240 }}>
                    <Typography>{d.labelKey ? t(String(d.labelKey)) : (d.label || '')}</Typography>
                  </Box>
                  <Button variant="outlined" component="label">{t('estrategia.attach')}<input type="file" hidden onChange={(e) => setDoc(idx, { file: e.target.files?.[0] ?? null })} /></Button>
                  <FilePreview projectId={projectIdToUse || projectId} file={d.file} fileName={d.file?.name || d.originalName || null} s3Key={(d as any).s3Key || (d as any).key || null} />
                  <Tooltip title={(() => {
                    try {
                      const uploader = (d.uploadedBy || (d.meta && typeof d.meta === 'object' ? d.meta.uploadedBy : undefined) || 'Desconhecido')
                      const date = d.createdAt ? new Date(d.createdAt).toLocaleString() : ''
                      return `${uploader}${date ? ' — ' + date : ''}`
                    } catch (e) { return 'Informações do arquivo' }
                  })()}>
                    <IconButton aria-label="Informações" sx={{ color: 'primary.main' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
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
              <Button variant="text" startIcon={<AddIcon />} onClick={addBem}>{t('capacidade.bem.addNew')}</Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
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
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained">{t('estrategia.saveButton')}</Button>
      </Box>
    </Box>
  )
}

export default EstrategiaForm
