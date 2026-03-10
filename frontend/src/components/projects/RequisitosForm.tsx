import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FilePreview from '../../components/common/FilePreview'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'

type Props = {
  initial?: any
  onSave?: (data: any) => void
}

const docRows = [
  'Organograma de Cargos e Funções',
  'Relatório de Endividamento',
  'Relatório SCI - do BACEN',
  'Relatório de Recebíveis',
  'Relatório de Estoque',
  'Relatório de Ativo',
  'Relatório de Aluguéis/Encargos'
]

const RequisitosForm: React.FC<Props> = ({ initial, onSave }) => {
  const { t } = useTranslation()
  const [selectedDocs, setSelectedDocs] = useState(() => {
    if (Array.isArray(initial?.docs) && initial.docs.length > 0) return initial.docs
    return docRows.map((label) => ({ label, selected: false, file: null as File | null }))
  })
  const [needs, setNeeds] = useState(initial?.needs ?? { descricao: '', requisitosTecnicos: '', prazo: '', observacoes: '' })

  const toggleDoc = (index: number) => setSelectedDocs((prev) => {
    const next = prev.slice()
    next[index] = { ...next[index], selected: !next[index].selected }
    return next
  })

  const setDocFile = (index: number, file: File | null) => setSelectedDocs((prev) => {
    const next = prev.slice()
    next[index] = { ...next[index], file }
    return next
  })

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const payload = { docs: selectedDocs, needs }
    if (onSave) onSave(payload)
    else alert('Requisitos salvos (simulado)')
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{t('requisitos.documents')}</Typography>
      <Grid container spacing={2}>
        {selectedDocs.map((d, i) => (
          <Grid item xs={12} key={d.label}>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} md={5}>
                  <FormControlLabel control={<Radio checked={d.selected} onChange={() => toggleDoc(i)} />} label={d.label} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button variant="outlined" component="label">{t('requisitos.attach')}<input type="file" hidden onChange={(e) => setDocFile(i, e.target.files?.[0] ?? null)} /></Button>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {d.file || d.originalName || d.name ? (
                      <FilePreview file={d.file} fileName={(d.file && d.file.name) || d.originalName || d.name || null} s3Key={(d as any).s3Key || (d as any).key || null} />
                    ) : null}
                    <Typography variant="caption">{d.file ? d.file.name : t('common.noFile')}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">{t('requisitos.status')}: {d.selected ? t('requisitos.requested') : t('requisitos.notRequested')}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6">{t('requisitos.title')}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField label={t('requisitos.description')} fullWidth multiline rows={4} value={needs.descricao} onChange={(e) => setNeeds((p: any) => ({ ...p, descricao: e.target.value }))} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label={t('requisitos.technicalRequirements')} fullWidth multiline rows={3} value={needs.requisitosTecnicos} onChange={(e) => setNeeds((p: any) => ({ ...p, requisitosTecnicos: e.target.value }))} />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField label={t('requisitos.deadline')} fullWidth value={needs.prazo} onChange={(e) => setNeeds((p: any) => ({ ...p, prazo: e.target.value }))} />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField label={t('requisitos.responsible')} fullWidth value={needs.responsavel} onChange={(e) => setNeeds((p: any) => ({ ...p, responsavel: e.target.value }))} />
        </Grid>
        <Grid item xs={12}>
          <TextField label={t('requisitos.notes')} fullWidth multiline rows={3} value={needs.observacoes} onChange={(e) => setNeeds((p: any) => ({ ...p, observacoes: e.target.value }))} />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained">{t('requisitos.save')}</Button>
      </Box>
    </Box>
  )
}

export default RequisitosForm
