import React, { useEffect, useState } from 'react'
import { Company, CreateCompanyPayload, UpdateCompanyPayload } from '../../types/company'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (payload: CreateCompanyPayload | UpdateCompanyPayload) => Promise<void>
  company?: Company | null
  saving?: boolean
}

const CompanyFormModal: React.FC<Props> = ({ open, onClose, onSave, company, saving }) => {
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#000000')
  const [secondaryColor, setSecondaryColor] = useState('#ffffff')
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (company) {
      setName(company.name || '')
      setLogoUrl(company.logoUrl || '')
      setPrimaryColor(company.primaryColor || '#000000')
      setSecondaryColor(company.secondaryColor || '#ffffff')
      setActive(company.active ?? true)
    } else {
      setName('')
      setLogoUrl('')
      setPrimaryColor('#000000')
      setSecondaryColor('#ffffff')
      setActive(true)
    }
    setErrors({})
  }, [company, open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!primaryColor) e.primaryColor = 'Primary color is required'
    if (!secondaryColor) e.secondaryColor = 'Secondary color is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    const payload: CreateCompanyPayload | UpdateCompanyPayload = {
      name: name.trim(),
      logoUrl: logoUrl?.trim() || undefined,
      primaryColor,
      secondaryColor,
      active,
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{company ? 'Edit Company' : 'Add Company'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={!!errors.name} helperText={errors.name} fullWidth />
          <Box>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const result = reader.result as string
                  // if result is data URL, store directly
                  setLogoUrl(result)
                }
                reader.readAsDataURL(file)
              }}
            />
            {logoUrl ? (
              <Box sx={{ mt: 1 }}>
                <img src={logoUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6 }} />
              </Box>
            ) : null}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label>Primary color</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: 48, height: 36, border: 0 }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label>Secondary color</label>
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} style={{ width: 48, height: 36, border: 0 }} />
            </Box>
          </Box>
          <FormControlLabel control={<Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />} label="Active" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CompanyFormModal
