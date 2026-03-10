import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormHelperText from '@mui/material/FormHelperText'
import { getCnaeClass, lookupCep as lookupCepApi } from '../../utils/apiLookups'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import VisibilityIcon from '@mui/icons-material/Visibility'
import InfoIcon from '@mui/icons-material/Info'
import FilePreview from '../common/FilePreview'

type Props = {
  initial?: any
  onSave?: (data: any) => void
  projectId?: string
  projectName?: string
}

const QualificationForm: React.FC<Props> = ({ initial, onSave, projectId: propProjectId, projectName: propProjectName }) => {
  const { t } = useTranslation()
  const [solicType, setSolicType] = useState<'PF' | 'PJ'>(initial?.solicType ?? 'PJ')
  const defaultData = {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    codigoEmpresa: '',
    cnaePrimario: '',
    cnaeSecundario: '',
    atividadePrimaria: '',
    atividadeSecundaria: '',
    enquadramentoFiscal: '',
    contratoFile: null as File | null,
    contratoName: null as string | null,
    contratoKey: null as string | null,
    pais: 'Brasil',
    endereco: { cep: '', endereco: '', bairro: '', numero: '', complemento: '', cidade: '', estado: '' },
    representante: { nome: '', cpf: '', cargo: '', telefone: '', whatsapp: '', email: '', pais: 'Brasil', endereco: { cep: '', endereco: '', bairro: '', numero: '', complemento: '', cidade: '', estado: '' } }
  }

  const mergedInitial = React.useMemo(() => {
    if (!initial) return defaultData
    return {
      ...defaultData,
      ...initial,
      endereco: { ...defaultData.endereco, ...(initial.endereco || {}) },
      representante: {
        ...defaultData.representante,
        ...(initial.representante || {}),
        endereco: { ...defaultData.representante.endereco, ...(initial.representante?.endereco || {}) },
      },
    }
  }, [initial])

  const [data, setData] = useState<any>(mergedInitial)
    const [uploadedKey, setUploadedKey] = useState<string | null>(mergedInitial?.contratoKey ?? null)
    const [uploadedName, setUploadedName] = useState<string | null>(mergedInitial?.contratoName ?? null)
    const [uploadedMeta, setUploadedMeta] = useState<any>(null)

    // debug logging for uploaded name/key/state
    React.useEffect(() => {
      console.log('QualificationForm mount/state (top):', {
        uploadedName,
        uploadedKey,
        uploadedMeta,
        dataContratoFile: data?.contratoFile?.name ?? null,
        dataContratoName: data?.contratoName ?? null,
        initialContratoName: initial?.contratoName ?? initial?.contrato_name ?? null,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedName, uploadedKey, uploadedMeta, data?.contratoFile, data?.contratoName, initial?.contratoName])

  React.useEffect(() => {
    setData(mergedInitial)
    setAdditionalReps(initial?.additionalReps ? initial.additionalReps : [])
    // sync additional CNAEs desc if provided
    if (initial?.additionalCnaes) {
      setAdditionalCnaes(initial.additionalCnaes.map((a: any) => a.code || ''))
      setAdditionalCnaesDesc(initial.additionalCnaes.map((a: any) => a.descricao || ''))
    }
  }, [mergedInitial, initial])

  // try to load existing uploaded file for this qualification (when reloading the page)
  React.useEffect(() => {
    ;(async () => {
      try {
        // If we already have both key and name, no need to reload list.
        if (uploadedKey && uploadedName) return
        const projectIdToUse = propProjectId || (initial && (initial.projectId || initial.project?.id))
        if (!projectIdToUse) return
        const { list } = await import('../../services/file.service')
        const files = await list(projectIdToUse)
        if (!files || files.length === 0) return
        // try to find a file associated with this qualification
        const qualId = initial?.id
        let found = null as any
        if (qualId) found = files.find((f: any) => String(f.qualificationId) === String(qualId))
        if (!found && uploadedKey) found = files.find((f: any) => (f.s3Key === uploadedKey || f.key === uploadedKey))
        if (!found) found = files.find((f: any) => (initial && initial.contratoName && f.originalName === initial.contratoName))
        if (!found) found = files[files.length - 1]
        if (found) {
          const key = found.s3Key || found.key
          setUploadedKey(key)
          setUploadedName(found.originalName || found.originalname || found.name || null)
          setUploadedMeta(found)
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [mergedInitial, initial, propProjectId, uploadedKey])

  // Additional mount-time safeguard: if we don't have an uploadedName, try to fetch metadata once
  React.useEffect(() => {
    ;(async () => {
      try {
        if (uploadedName) return
        const projectIdToUse = propProjectId || (initial && (initial.projectId || initial.project?.id))
        if (!projectIdToUse) return
        const { list } = await import('../../services/file.service')
        const files = await list(projectIdToUse)
        if (!files || files.length === 0) return
        const qualId = initial?.id
        let found = null as any
        if (qualId) found = files.find((f: any) => String(f.qualificationId) === String(qualId))
        if (!found && initial?.contratoName) found = files.find((f: any) => f.originalName === initial.contratoName)
        if (!found) found = files[files.length - 1]
        if (found) {
          const key = found.s3Key || found.key
          setUploadedKey(key)
          setUploadedName(found.originalName || found.originalname || found.name || null)
          setUploadedMeta(found)
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [propProjectId, initial, uploadedName])

  // If the parent passes updated initial (after save), sync contrato name/key into state
  React.useEffect(() => {
    try {
      const maybeName = initial?.contratoName || initial?.contrato_name || initial?.data?.contratoName || initial?.data?.contrato_name || null
      const maybeKey = initial?.contratoKey || initial?.contrato_key || initial?.data?.contratoKey || initial?.data?.contrato_key || null
      if (maybeName && maybeName !== uploadedName) setUploadedName(maybeName)
      if (maybeKey && maybeKey !== uploadedKey) setUploadedKey(maybeKey)
    } catch (e) {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const setPath = (path: string, value: any) => {
    if (!path.includes('.')) return setData((p: any) => ({ ...p, [path]: value }))
    const parts = path.split('.')
    setData((prev: any) => {
      const next = { ...prev }
      if (parts.length === 2) next[parts[0]] = { ...next[parts[0]], [parts[1]]: value }
      else if (parts.length === 3) next[parts[0]] = { ...next[parts[0]], [parts[1]]: { ...next[parts[0]][parts[1]], [parts[2]]: value } }
      return next
    })
  }

  const [cepError, setCepError] = useState<string | null>(null)
  const [cepErrorRep, setCepErrorRep] = useState<string | null>(null)
  const [cnaePrimDesc, setCnaePrimDesc] = useState<string | null>(null)
  const [cnaeSecDesc, setCnaeSecDesc] = useState<string | null>(null)
  const [cnaePrimError, setCnaePrimError] = useState<string | null>(null)
  const [cnaeSecError, setCnaeSecError] = useState<string | null>(null)
  const [additionalCnaes, setAdditionalCnaes] = React.useState<string[]>(() => (initial?.additionalCnaes ? initial.additionalCnaes.map((a: any) => a.code || '') : []))
  const [additionalCnaesDesc, setAdditionalCnaesDesc] = React.useState<string[]>(() => (initial?.additionalCnaes ? initial.additionalCnaes.map((a: any) => a.descricao || '') : []))
  const [additionalCnaesErr, setAdditionalCnaesErr] = React.useState<string[]>([])
  const [nomeFantasiaError, setNomeFantasiaError] = useState<string | null>(null)

  const lookupCep = async (cepRaw: string, prefix: 'endereco' | 'representante.endereco') => {
    const digits = (cepRaw || '').replace(/\D/g, '')
    if (digits.length < 8) return
    try {
      const json = await lookupCepApi(digits)
      if (!json) throw new Error('CEP não encontrado')
      const street = json.rua || ''
      const bairro = json.bairro || ''
      const cidade = json.cidade || ''
      const estado = json.estado || ''
      if (prefix === 'endereco') {
        setPath('endereco.endereco', street)
        setPath('endereco.bairro', bairro)
        setPath('endereco.cidade', cidade)
        setPath('endereco.estado', estado)
        setCepError(null)
      } else {
        setPath('representante.endereco.endereco', street)
        setPath('representante.endereco.bairro', bairro)
        setPath('representante.endereco.cidade', cidade)
        setPath('representante.endereco.estado', estado)
        setCepErrorRep(null)
      }
    } catch (e: any) {
      if (prefix === 'endereco') setCepError(e?.message || 'Erro ao buscar CEP')
      else setCepErrorRep(e?.message || 'Erro ao buscar CEP')
    }
  }

  // Simple input masks
  const formatCNPJ = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 14)
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
      .replace(/(\.\d{3}\.\d{3})(\d)/, '$1/ $2')
      .replace(/(\/(\d{4}))(\d)/, '$1-$3')
      .replace(/\s/g, '')
      .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})-(\d{2})?/, '$1-$2')
  }

  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3}\.\d{3})(\d)/, '$1.$2').replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2')
  }

  const formatCEP = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8)
    return d.replace(/(\d{5})(\d{1,3})/, (m, p1, p2) => (p2 ? `${p1}-${p2}` : p1))
  }

  const handleCnpjChange = (val: string) => setPath('cnpj', formatCNPJ(val))
  const handleCpfChange = (val: string) => setPath('representante.cpf', formatCPF(val))
  const handleCepChange = (val: string) => setPath('endereco.cep', formatCEP(val))
  const handleCepRepChange = (val: string) => setPath('representante.endereco.cep', formatCEP(val))
  const handleNomeFantasiaChange = (val: string) => { setPath('nomeFantasia', val); setNomeFantasiaError(null) }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setNomeFantasiaError(null)
    if (!data.nomeFantasia || !String(data.nomeFantasia).trim()) {
      setNomeFantasiaError('Nome Fantasia é obrigatório')
      return
    }
    ;(async () => {
      const payload = { solicType, ...data, additionalCnaes: additionalCnaes.map((code, i) => ({ code, descricao: additionalCnaesDesc[i] || null })), additionalReps }
      try {
        if (!onSave) {
          alert('Qualificação salva (simulada)')
          return
        }
        // First save qualification to get its id
        const saved: any = await (onSave as any)(payload)

        // If there's a contrato file, upload via presigned URL and save metadata
            if (data.contratoFile && saved?.id) {
          try {
            const file = data.contratoFile as File
            const { presign } = await import('../../services/file.service')
            const projectIdToUse = saved.projectId || (saved.project && saved.project.id) || (payload.projectId) || propProjectId
            const tabName = 'Qualificação de contrato'
            const p = await presign(projectIdToUse, file.name, propProjectName, tabName)
            // upload to S3 via PUT
            const uploadRes = await fetch(p.url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
            if (!uploadRes.ok) {
              console.error('S3 upload failed', uploadRes.status, uploadRes.statusText)
              alert('Falha ao enviar arquivo para S3: ' + uploadRes.status)
              throw new Error(`S3 upload failed: ${uploadRes.status}`)
            }
            // save metadata only if upload succeeded
            const { saveMetadata, list } = await import('../../services/file.service')
            const savedMeta = await saveMetadata(saved.projectId || (saved.project && saved.project.id) || (payload.projectId), {
              key: p.key,
              originalName: file.name,
              mimeType: file.type,
              size: file.size,
              qualificationId: saved.id,
            })
            // remember uploaded key, name and metadata for preview, clear input
            setUploadedKey(p.key)
            setUploadedName(file.name)
            setPath('contratoName', file.name)
            setPath('contratoKey', p.key)
            // persist contratoName/Key into qualification
            try {
              if (onSave) await (onSave as any)({ solicType, ...data, contratoName: file.name, contratoKey: p.key, additionalCnaes: additionalCnaes.map((code, i) => ({ code, descricao: additionalCnaesDesc[i] || null })), additionalReps })
            } catch (e) { 
              // ignore save errors here
            }
            setUploadedMeta(savedMeta)
            setPath('contratoFile', null)
          } catch (e) {
            console.warn('Presign upload failed — falling back to backend upload', e)
            try {
              const file = data.contratoFile as File
              const projectId = saved.projectId || (saved.project && saved.project.id) || (payload.projectId) || propProjectId
              const fd = new FormData()
              fd.append('file', file)
              const tabName = 'Qualificação de contrato'
              if (propProjectName) fd.append('projectName', propProjectName)
              fd.append('tabName', tabName)
              const uploadResp = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: fd })
              if (!uploadResp.ok) {
                console.error('Backend upload failed', uploadResp.status, uploadResp.statusText)
                alert('Falha ao enviar arquivo para o servidor: ' + uploadResp.status)
                throw new Error(`Backend upload failed: ${uploadResp.status}`)
              }
              const json = await uploadResp.json()
              console.log('Arquivo enviado via backend (fallback):', json)
              // backend already persisted metadata; remember key for preview
              if (json && json.key) {
                setUploadedKey(json.key)
                setUploadedName(file.name)
                setPath('contratoName', file.name)
                setPath('contratoKey', json.key)
                try {
                  if (onSave) await (onSave as any)({ solicType, ...data, contratoName: file.name, contratoKey: json.key, additionalCnaes: additionalCnaes.map((code, i) => ({ code, descricao: additionalCnaesDesc[i] || null })), additionalReps })
                } catch (e) {
                  // ignore
                }
                // backend persisted metadata; try to fetch it
                try {
                  const { list } = await import('../../services/file.service')
                  const files = await list(projectId)
                  const meta = files.find((f: any) => f.s3Key === json.key || f.key === json.key)
                  if (meta) setUploadedMeta(meta)
                } catch (e) {
                  // ignore
                }
                setPath('contratoFile', null)
              }
            } catch (err2) {
              console.error('Fallback upload also failed', err2)
            }
          }
        }
      } catch (e) {
        console.error('Erro ao salvar qualificação', e)
      }
    })()
  }

  // Additional representatives state (multiple)
  const [additionalReps, setAdditionalReps] = React.useState<any[]>(() => (initial?.additionalReps ? initial.additionalReps : []))

  const defaultRep = () => ({
    nome: '',
    cpf: '',
    cargo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    pais: 'Brasil',
    endereco: { cep: '', endereco: '', bairro: '', numero: '', complemento: '', cidade: '', estado: '' }
  })

  const addRepresentative = () => setAdditionalReps((p) => [...p, defaultRep()])

  const removeRepresentative = (index: number) => setAdditionalReps((p) => p.filter((_, i) => i !== index))

  const setAdditionalRepField = (index: number, path: string, value: any) => {
    setAdditionalReps((prev) => {
      const copy = [...prev]
      const rep = { ...copy[index] }
      if (!path.includes('.')) rep[path] = value
      else {
        const parts = path.split('.')
        if (parts.length === 2) rep[parts[0]] = { ...rep[parts[0]], [parts[1]]: value }
        else if (parts.length === 3) rep[parts[0]] = { ...rep[parts[0]], [parts[1]]: { ...rep[parts[0]][parts[1]], [parts[2]]: value } }
      }
      copy[index] = rep
      return copy
    })
  }

  const handleAdditionalCpfChange = (index: number, val: string) => setAdditionalRepField(index, 'cpf', formatCPF(val))
  const handleAdditionalCepChange = (index: number, val: string) => setAdditionalRepField(index, 'endereco.cep', formatCEP(val))

  const lookupCepForAdditional = async (index: number, cepRaw: string) => {
    const digits = (cepRaw || '').replace(/\D/g, '')
    if (digits.length < 8) return
    try {
      const json = await lookupCepApi(digits)
      if (!json) throw new Error('CEP não encontrado')
      const street = json.rua || ''
      const bairro = json.bairro || ''
      const cidade = json.cidade || ''
      const estado = json.estado || ''
      setAdditionalRepField(index, 'endereco.endereco', street)
      setAdditionalRepField(index, 'endereco.bairro', bairro)
      setAdditionalRepField(index, 'endereco.cidade', cidade)
      setAdditionalRepField(index, 'endereco.estado', estado)
    } catch (e) {
      // ignore for now, could set per-rep error state
    }
  }

  const lookupCnae = async (code: string, activityPath: string, setDesc: (v: string | null) => void, setErr: (v: string | null) => void) => {
    console.log('lookupCnae called with', code)
    const cleaned = (code || '').replace(/\D/g, '')
    console.log('lookupCnae cleaned ->', cleaned)
    if (!cleaned) return
    setErr(null)
    setDesc(null)
    try {
      const data = await getCnaeClass(cleaned)
      console.log('getCnaeClass result for', cleaned, data)
      if (!data) {
        setErr('CNAE não encontrado')
        return
      }
      // data can be object or array
      const item = Array.isArray(data) ? data[0] : data
      const descricao = item?.descricao || item?.atividades?.[0] || ''
      setDesc(descricao || null)
      if (descricao) setPath(activityPath, descricao)
    } catch (e: any) {
      console.error('lookupCnae error', e)
      setErr('Erro ao consultar CNAE')
    }
  }

  const addAdditionalCnae = () => {
    setAdditionalCnaes((p) => [...p, ''])
    setAdditionalCnaesDesc((p) => [...p, ''])
    setAdditionalCnaesErr((p) => [...p, ''])
  }

  const removeAdditionalCnae = (index: number) => {
    setAdditionalCnaes((p) => p.filter((_, i) => i !== index))
    setAdditionalCnaesDesc((p) => p.filter((_, i) => i !== index))
    setAdditionalCnaesErr((p) => p.filter((_, i) => i !== index))
  }

  const setAdditionalCnaeValue = (index: number, value: string) => {
    setAdditionalCnaes((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const lookupAdditionalCnae = async (index: number, code: string) => {
    const cleaned = (code || '').replace(/\D/g, '')
    if (!cleaned) return
    const newErr = [...additionalCnaesErr]
    const newDesc = [...additionalCnaesDesc]
    newErr[index] = ''
    newDesc[index] = ''
    setAdditionalCnaesErr(newErr)
    setAdditionalCnaesDesc(newDesc)
    try {
      const data = await getCnaeClass(cleaned)
      if (!data) {
        newErr[index] = 'CNAE não encontrado'
        setAdditionalCnaesErr([...newErr])
        return
      }
      const item = Array.isArray(data) ? data[0] : data
      const descricao = item?.descricao || item?.atividades?.[0] || ''
      newDesc[index] = descricao || ''
      setAdditionalCnaesDesc([...newDesc])
    } catch (e) {
      newErr[index] = 'Erro ao consultar CNAE'
      setAdditionalCnaesErr([...newErr])
    }
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Tipo de Solicitação</FormLabel>
            <RadioGroup row value={solicType} onChange={(e) => setSolicType(e.target.value as any)}>
              <FormControlLabel value="PF" control={<Radio />} label="Pessoa Física" />
              <FormControlLabel value="PJ" control={<Radio />} label="Pessoa Jurídica" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {solicType === 'PJ' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField label="Razão Social" fullWidth value={data.razaoSocial} onChange={(e) => setPath('razaoSocial', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Nome Fantasia" required fullWidth value={data.nomeFantasia} onChange={(e) => handleNomeFantasiaChange(e.target.value)} error={!!nomeFantasiaError} helperText={nomeFantasiaError ?? ''} />
            </Grid>

            <Grid item xs={12} md={4}>
              {data.pais === 'Brasil' ? (
                <TextField label="CNPJ" fullWidth value={data.cnpj} onChange={(e) => handleCnpjChange(e.target.value)} />
              ) : (
                <TextField label="Código da empresa" fullWidth value={data.codigoEmpresa || ''} onChange={(e) => setPath('codigoEmpresa', e.target.value)} />
              )}
            </Grid>
            {data.pais === 'Brasil' ? (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="CNAE Primário"
                    fullWidth
                    value={data.cnaePrimario}
                    onChange={(e) => setPath('cnaePrimario', e.target.value)}
                    onBlur={(e) => lookupCnae(e.target.value, 'atividadePrimaria', setCnaePrimDesc, setCnaePrimError)}
                    helperText={cnaePrimError ?? cnaePrimDesc ?? ''}
                    error={!!cnaePrimError}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="CNAE Secundário"
                    fullWidth
                    value={data.cnaeSecundario}
                    onChange={(e) => setPath('cnaeSecundario', e.target.value)}
                    onBlur={(e) => lookupCnae(e.target.value, 'atividadeSecundaria', setCnaeSecDesc, setCnaeSecError)}
                    helperText={cnaeSecError ?? cnaeSecDesc ?? ''}
                    error={!!cnaeSecError}
                  />
                </Grid>
                <Grid item xs={12} md={8} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={addAdditionalCnae} startIcon={<AddIcon />}>Adicionar CNAE secundário</Button>
                </Grid>
                {/* additional secondary CNAEs */}
                {additionalCnaes.map((code, idx) => (
                  <Grid item xs={12} md={12} key={`add-cnae-${idx}`}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <TextField label={`CNAE Secundário ${idx + 1}`} fullWidth value={code} onChange={(e) => setAdditionalCnaeValue(idx, e.target.value)} onBlur={(e) => lookupAdditionalCnae(idx, e.target.value)} helperText={additionalCnaesErr[idx] ?? additionalCnaesDesc[idx] ?? ''} error={!!additionalCnaesErr[idx]} />
                      </Grid>
                      <Grid item>
                        <IconButton onClick={() => removeAdditionalCnae(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Grid>
                ))}
                <Grid item xs={12} md={6}>
                  <TextField label="Atividade Primária" fullWidth value={data.atividadePrimaria} onChange={(e) => setPath('atividadePrimaria', e.target.value)} disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Atividade Secundária" fullWidth value={data.atividadeSecundaria} onChange={(e) => setPath('atividadeSecundaria', e.target.value)} disabled />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={4}>
                  <div style={{ visibility: 'hidden', height: 0 }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <div style={{ visibility: 'hidden', height: 0 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Atividade Primária" fullWidth value={data.atividadePrimaria} onChange={(e) => setPath('atividadePrimaria', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Atividade Secundária" fullWidth value={data.atividadeSecundaria} onChange={(e) => setPath('atividadeSecundaria', e.target.value)} />
                </Grid>
              </>
            )}

            {data.pais === 'Brasil' ? (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Select value={data.enquadramentoFiscal} onChange={(e) => setPath('enquadramentoFiscal', e.target.value)}>
                    <MenuItem value="MEI">MEI</MenuItem>
                    <MenuItem value="Simples Nacional">Simples Nacional</MenuItem>
                    <MenuItem value="Lucro Presumido">Lucro Presumido</MenuItem>
                    <MenuItem value="Lucro Real">Lucro Real</MenuItem>
                  </Select>
                  <FormHelperText>Enquadramento Fiscal</FormHelperText>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12} md={6}>
                <TextField label="Enquadramento Fiscal" fullWidth value={data.enquadramentoFiscal} onChange={(e) => setPath('enquadramentoFiscal', e.target.value)} />
              </Grid>
            )}
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant="outlined" component="label">Anexar Contrato Social
                <input
                  type="file"
                  hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null
                      console.log('Selected contrato file:', f?.name ?? null)
                      setPath('contratoFile', f)
                      if (f) {
                        setUploadedMeta(null)
                        setUploadedName(null)
                      }
                    }}
                />
              </Button>
                <FilePreview projectId={propProjectId || data.projectId || initial?.projectId} file={data?.contratoFile} fileName={data?.contratoFile?.name || uploadedName || data?.contratoName || initial?.contratoName || t('projectDetail.noFile')} s3Key={uploadedKey} />
              {uploadedKey ? (
                <>
                  <Tooltip title={uploadedMeta ? `${uploadedMeta.uploadedBy || 'Desconhecido'} — ${new Date(uploadedMeta.createdAt).toLocaleString()}` : 'Informações do arquivo'}>
                    <IconButton aria-label="Informações do contrato" sx={{ color: 'primary.main' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton aria-label="Visualizar contrato" sx={{ color: 'primary.main' }} onClick={async () => {
                    try {
                      const projectIdToUse = data.projectId || propProjectId || (initial?.projectId)
                      const { presignGet } = await import('../../services/file.service')
                      const res = await presignGet(projectIdToUse || '', uploadedKey)
                      if (res && res.url) window.open(res.url, '_blank')
                      else alert('Não foi possível obter URL de visualização')
                    } catch (e) {
                      console.error('Erro ao obter presign get', e)
                      alert('Erro ao obter URL de visualização')
                    }
                  }}>
                    <VisibilityIcon />
                  </IconButton>
                </>
              ) : null}
            </Grid>

            <Grid item xs={12} md={4}>
              <Select fullWidth value={data.pais} onChange={(e) => setPath('pais', e.target.value)}>
                <MenuItem value="Brasil">Brasil</MenuItem>
                <MenuItem value="EUA">EUA</MenuItem>
                <MenuItem value="China">China</MenuItem>
                <MenuItem value="Espanha">Espanha</MenuItem>
                <MenuItem value="Paraguai">Paraguai</MenuItem>
              </Select>
            </Grid>

            {data.pais === 'Brasil' ? (
              <>
                <Grid item xs={12} md={2}>
                  <TextField label="CEP" fullWidth value={data.endereco.cep} onChange={(e) => handleCepChange(e.target.value)} onBlur={(e) => lookupCep(e.target.value, 'endereco')} helperText={cepError ?? ''} error={!!cepError} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Endereço" fullWidth value={data.endereco.endereco} onChange={(e) => setPath('endereco.endereco', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Bairro" fullWidth value={data.endereco.bairro} onChange={(e) => setPath('endereco.bairro', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="Número" fullWidth value={data.endereco.numero} onChange={(e) => setPath('endereco.numero', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Complemento" fullWidth value={data.endereco.complemento} onChange={(e) => setPath('endereco.complemento', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Cidade" fullWidth value={data.endereco.cidade} onChange={(e) => setPath('endereco.cidade', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Estado" fullWidth value={data.endereco.estado} onChange={(e) => setPath('endereco.estado', e.target.value)} />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={2}>
                  <div style={{ visibility: 'hidden', height: 0 }} />
                </Grid>
                <Grid item xs={12} md={10}>
                  <TextField label="Endereço completo" fullWidth value={data.endereco.enderecoCompleto || ''} onChange={(e) => setPath('endereco.enderecoCompleto', e.target.value)} />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1">Representante Legal</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Nome do Representante" fullWidth value={data.representante.nome} onChange={(e) => setPath('representante.nome', e.target.value)} />
                  </Grid>
                  {data.representante.pais === 'Brasil' ? (
                    <Grid item xs={12} md={3}>
                      <TextField label="CPF" fullWidth value={data.representante.cpf} onChange={(e) => handleCpfChange(e.target.value)} />
                    </Grid>
                  ) : (
                    <Grid item xs={12} md={3}><div style={{ visibility: 'hidden', height: 0 }} /></Grid>
                  )}
                  <Grid item xs={12} md={3}>
                    <TextField label="Cargo" fullWidth value={data.representante.cargo} onChange={(e) => setPath('representante.cargo', e.target.value)} />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField label="Telefone" fullWidth value={data.representante.telefone} onChange={(e) => setPath('representante.telefone', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Whatsapp" fullWidth value={data.representante.whatsapp} onChange={(e) => setPath('representante.whatsapp', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="E-mail" fullWidth value={data.representante.email} onChange={(e) => setPath('representante.email', e.target.value)} />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Select fullWidth value={data.representante.pais} onChange={(e) => setPath('representante.pais', e.target.value)}>
                      <MenuItem value="Brasil">Brasil</MenuItem>
                      <MenuItem value="EUA">EUA</MenuItem>
                      <MenuItem value="China">China</MenuItem>
                      <MenuItem value="Espanha">Espanha</MenuItem>
                      <MenuItem value="Paraguai">Paraguai</MenuItem>
                    </Select>
                  </Grid>

                  {data.representante.pais === 'Brasil' ? (
                    <>
                      <Grid item xs={12} md={2}>
                        <TextField label="CEP" fullWidth value={data.representante.endereco.cep} onChange={(e) => handleCepRepChange(e.target.value)} onBlur={(e) => lookupCep(e.target.value, 'representante.endereco')} helperText={cepErrorRep ?? ''} error={!!cepErrorRep} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField label="Endereço" fullWidth value={data.representante.endereco.endereco} onChange={(e) => setPath('representante.endereco.endereco', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Bairro" fullWidth value={data.representante.endereco.bairro} onChange={(e) => setPath('representante.endereco.bairro', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField label="Número" fullWidth value={data.representante.endereco.numero} onChange={(e) => setPath('representante.endereco.numero', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Complemento" fullWidth value={data.representante.endereco.complemento} onChange={(e) => setPath('representante.endereco.complemento', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Cidade" fullWidth value={data.representante.endereco.cidade} onChange={(e) => setPath('representante.endereco.cidade', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Estado" fullWidth value={data.representante.endereco.estado} onChange={(e) => setPath('representante.endereco.estado', e.target.value)} />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} md={3}>
                        <div style={{ visibility: 'hidden', height: 0 }} />
                      </Grid>
                      <Grid item xs={12} md={9}>
                        <TextField label="Endereço completo" fullWidth value={data.representante.endereco.enderecoCompleto || ''} onChange={(e) => setPath('representante.endereco.enderecoCompleto', e.target.value)} />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Button startIcon={<AddIcon />} variant="outlined" onClick={addRepresentative}>Adicionar representante legal</Button>
            </Grid>

            {/* Additional representatives accordion list */}
            {additionalReps.map((rep, idx) => (
              <Grid item xs={12} key={`rep-${idx}`}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Representante Adicional {idx + 1}</Typography>
                    <IconButton edge="end" onClick={(e) => { e.stopPropagation(); removeRepresentative(idx); }} sx={{ ml: 2 }}>
                      <DeleteIcon />
                    </IconButton>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField label="Nome do Representante" fullWidth value={rep.nome} onChange={(e) => setAdditionalRepField(idx, 'nome', e.target.value)} />
                      </Grid>
                      {rep.pais === 'Brasil' ? (
                        <Grid item xs={12} md={3}>
                          <TextField label="CPF" fullWidth value={rep.cpf} onChange={(e) => handleAdditionalCpfChange(idx, e.target.value)} />
                        </Grid>
                      ) : (
                        <Grid item xs={12} md={3}><div style={{ visibility: 'hidden', height: 0 }} /></Grid>
                      )}
                      <Grid item xs={12} md={3}>
                        <TextField label="Cargo" fullWidth value={rep.cargo} onChange={(e) => setAdditionalRepField(idx, 'cargo', e.target.value)} />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField label="Telefone" fullWidth value={rep.telefone} onChange={(e) => setAdditionalRepField(idx, 'telefone', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField label="Whatsapp" fullWidth value={rep.whatsapp} onChange={(e) => setAdditionalRepField(idx, 'whatsapp', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField label="E-mail" fullWidth value={rep.email} onChange={(e) => setAdditionalRepField(idx, 'email', e.target.value)} />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Select fullWidth value={rep.pais} onChange={(e) => setAdditionalRepField(idx, 'pais', e.target.value)}>
                          <MenuItem value="Brasil">Brasil</MenuItem>
                          <MenuItem value="EUA">EUA</MenuItem>
                          <MenuItem value="China">China</MenuItem>
                          <MenuItem value="Espanha">Espanha</MenuItem>
                          <MenuItem value="Paraguai">Paraguai</MenuItem>
                        </Select>
                      </Grid>

                      {rep.pais === 'Brasil' ? (
                        <>
                          <Grid item xs={12} md={2}>
                            <TextField label="CEP" fullWidth value={rep.endereco.cep} onChange={(e) => handleAdditionalCepChange(idx, e.target.value)} onBlur={(e) => lookupCepForAdditional(idx, e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField label="Endereço" fullWidth value={rep.endereco.endereco} onChange={(e) => setAdditionalRepField(idx, 'endereco.endereco', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Bairro" fullWidth value={rep.endereco.bairro} onChange={(e) => setAdditionalRepField(idx, 'endereco.bairro', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField label="Número" fullWidth value={rep.endereco.numero} onChange={(e) => setAdditionalRepField(idx, 'endereco.numero', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Complemento" fullWidth value={rep.endereco.complemento} onChange={(e) => setAdditionalRepField(idx, 'endereco.complemento', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Cidade" fullWidth value={rep.endereco.cidade} onChange={(e) => setAdditionalRepField(idx, 'endereco.cidade', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Estado" fullWidth value={rep.endereco.estado} onChange={(e) => setAdditionalRepField(idx, 'endereco.estado', e.target.value)} />
                          </Grid>
                        </>
                      ) : (
                        <>
                          <Grid item xs={12} md={3}>
                            <div style={{ visibility: 'hidden', height: 0 }} />
                          </Grid>
                          <Grid item xs={12} md={9}>
                            <TextField label="Endereço completo" fullWidth value={rep.endereco.enderecoCompleto || ''} onChange={(e) => setAdditionalRepField(idx, 'endereco.enderecoCompleto', e.target.value)} />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button variant="contained" type="submit">Salvar Qualificação</Button>
            </Grid>
          </>
        )}
        {solicType === 'PF' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField label="Nome Fantasia" required fullWidth value={data.nomeFantasia} onChange={(e) => handleNomeFantasiaChange(e.target.value)} error={!!nomeFantasiaError} helperText={nomeFantasiaError ?? ''} />
            </Grid>

          

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1">Representante Legal</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Nome do Representante" fullWidth value={data.representante.nome} onChange={(e) => setPath('representante.nome', e.target.value)} />
                  </Grid>
                  {data.representante.pais === 'Brasil' ? (
                    <Grid item xs={12} md={3}>
                      <TextField label="CPF" fullWidth value={data.representante.cpf} onChange={(e) => handleCpfChange(e.target.value)} />
                    </Grid>
                  ) : (
                    <Grid item xs={12} md={3}><div style={{ visibility: 'hidden', height: 0 }} /></Grid>
                  )}
                  <Grid item xs={12} md={3}>
                    <TextField label="Cargo" fullWidth value={data.representante.cargo} onChange={(e) => setPath('representante.cargo', e.target.value)} />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField label="Telefone" fullWidth value={data.representante.telefone} onChange={(e) => setPath('representante.telefone', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Whatsapp" fullWidth value={data.representante.whatsapp} onChange={(e) => setPath('representante.whatsapp', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="E-mail" fullWidth value={data.representante.email} onChange={(e) => setPath('representante.email', e.target.value)} />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Select fullWidth value={data.representante.pais} onChange={(e) => setPath('representante.pais', e.target.value)}>
                      <MenuItem value="Brasil">Brasil</MenuItem>
                      <MenuItem value="EUA">EUA</MenuItem>
                      <MenuItem value="China">China</MenuItem>
                      <MenuItem value="Espanha">Espanha</MenuItem>
                      <MenuItem value="Paraguai">Paraguai</MenuItem>
                    </Select>
                  </Grid>

                  {data.representante.pais === 'Brasil' ? (
                    <>
                      <Grid item xs={12} md={2}>
                        <TextField label="CEP" fullWidth value={data.representante.endereco.cep} onChange={(e) => handleCepRepChange(e.target.value)} onBlur={(e) => lookupCep(e.target.value, 'representante.endereco')} helperText={cepErrorRep ?? ''} error={!!cepErrorRep} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField label="Endereço" fullWidth value={data.representante.endereco.endereco} onChange={(e) => setPath('representante.endereco.endereco', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Bairro" fullWidth value={data.representante.endereco.bairro} onChange={(e) => setPath('representante.endereco.bairro', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField label="Número" fullWidth value={data.representante.endereco.numero} onChange={(e) => setPath('representante.endereco.numero', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Complemento" fullWidth value={data.representante.endereco.complemento} onChange={(e) => setPath('representante.endereco.complemento', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Cidade" fullWidth value={data.representante.endereco.cidade} onChange={(e) => setPath('representante.endereco.cidade', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Estado" fullWidth value={data.representante.endereco.estado} onChange={(e) => setPath('representante.endereco.estado', e.target.value)} />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} md={3}>
                        <div style={{ visibility: 'hidden', height: 0 }} />
                      </Grid>
                      <Grid item xs={12} md={9}>
                        <TextField label="Endereço completo" fullWidth value={data.representante.endereco.enderecoCompleto || ''} onChange={(e) => setPath('representante.endereco.enderecoCompleto', e.target.value)} />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Button startIcon={<AddIcon />} variant="outlined" onClick={addRepresentative}>Adicionar representante legal</Button>
            </Grid>

            {/* Additional representatives accordion list (PF) */}
            {additionalReps.map((rep, idx) => (
              <Grid item xs={12} key={`rep-pf-${idx}`}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Representante Adicional {idx + 1}</Typography>
                    <IconButton edge="end" onClick={(e) => { e.stopPropagation(); removeRepresentative(idx); }} sx={{ ml: 2 }}>
                      <DeleteIcon />
                    </IconButton>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField label="Nome do Representante" fullWidth value={rep.nome} onChange={(e) => setAdditionalRepField(idx, 'nome', e.target.value)} />
                      </Grid>
                      {rep.pais === 'Brasil' ? (
                        <Grid item xs={12} md={3}>
                          <TextField label="CPF" fullWidth value={rep.cpf} onChange={(e) => handleAdditionalCpfChange(idx, e.target.value)} />
                        </Grid>
                      ) : (
                        <Grid item xs={12} md={3}><div style={{ visibility: 'hidden', height: 0 }} /></Grid>
                      )}
                      <Grid item xs={12} md={3}>
                        <TextField label="Cargo" fullWidth value={rep.cargo} onChange={(e) => setAdditionalRepField(idx, 'cargo', e.target.value)} />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField label="Telefone" fullWidth value={rep.telefone} onChange={(e) => setAdditionalRepField(idx, 'telefone', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField label="Whatsapp" fullWidth value={rep.whatsapp} onChange={(e) => setAdditionalRepField(idx, 'whatsapp', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField label="E-mail" fullWidth value={rep.email} onChange={(e) => setAdditionalRepField(idx, 'email', e.target.value)} />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Select fullWidth value={rep.pais} onChange={(e) => setAdditionalRepField(idx, 'pais', e.target.value)}>
                          <MenuItem value="Brasil">Brasil</MenuItem>
                          <MenuItem value="EUA">EUA</MenuItem>
                          <MenuItem value="China">China</MenuItem>
                          <MenuItem value="Espanha">Espanha</MenuItem>
                          <MenuItem value="Paraguai">Paraguai</MenuItem>
                        </Select>
                      </Grid>

                      {rep.pais === 'Brasil' ? (
                        <>
                          <Grid item xs={12} md={2}>
                            <TextField label="CEP" fullWidth value={rep.endereco.cep} onChange={(e) => handleAdditionalCepChange(idx, e.target.value)} onBlur={(e) => lookupCepForAdditional(idx, e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField label="Endereço" fullWidth value={rep.endereco.endereco} onChange={(e) => setAdditionalRepField(idx, 'endereco.endereco', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Bairro" fullWidth value={rep.endereco.bairro} onChange={(e) => setAdditionalRepField(idx, 'endereco.bairro', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField label="Número" fullWidth value={rep.endereco.numero} onChange={(e) => setAdditionalRepField(idx, 'endereco.numero', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Complemento" fullWidth value={rep.endereco.complemento} onChange={(e) => setAdditionalRepField(idx, 'endereco.complemento', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Cidade" fullWidth value={rep.endereco.cidade} onChange={(e) => setAdditionalRepField(idx, 'endereco.cidade', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField label="Estado" fullWidth value={rep.endereco.estado} onChange={(e) => setAdditionalRepField(idx, 'endereco.estado', e.target.value)} />
                          </Grid>
                        </>
                      ) : (
                        <>
                          <Grid item xs={12} md={3}>
                            <div style={{ visibility: 'hidden', height: 0 }} />
                          </Grid>
                          <Grid item xs={12} md={9}>
                            <TextField label="Endereço completo" fullWidth value={rep.endereco.enderecoCompleto || ''} onChange={(e) => setAdditionalRepField(idx, 'endereco.enderecoCompleto', e.target.value)} />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button variant="contained" type="submit">Salvar Qualificação</Button>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  )
}

export default QualificationForm
