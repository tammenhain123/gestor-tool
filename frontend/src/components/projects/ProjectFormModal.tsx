import React, { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import { User } from '../../types/user'
import { CreateProjectPayload } from '../../types/project'
import { fetchUsers } from '../../services/user.service'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (payload: CreateProjectPayload) => Promise<void>
  project?: any | null
  saving?: boolean
}

const ProjectFormModal: React.FC<Props> = ({ open, onClose, onSave, project, saving }) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<'SAAS' | 'OFERTA' | 'DEMANDA'>('SAAS')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [viewerUsers, setViewerUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name || '')
      setType(project.type || 'SAAS')
      setDescription(project.description || '')
      setImageUrl(project.imageUrl || '')
      const existingAdmins = (project as any).admins ?? ((project as any).admin ? (Array.isArray((project as any).admin) ? (project as any).admin : [(project as any).admin]) : [])
      const existingViewers = (project as any).viewers ?? ((project as any).viewer ? (Array.isArray((project as any).viewer) ? (project as any).viewer : [(project as any).viewer]) : [])
      setAdminUsers(existingAdmins)
      setViewerUsers(existingViewers)
    } else {
      setName('')
      setType('SAAS')
      setDescription('')
      setImageUrl('')
      setAdminUsers([])
      setViewerUsers([])
    }
  }, [project, open])

  useEffect(() => {
    setLoadingUsers(true)
    fetchUsers()
      .then((data) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [])

  const handleSave = async () => {
    const payload: CreateProjectPayload = {
      name: name.trim(),
      type,
      description: description?.trim() || undefined,
      imageUrl: imageUrl?.trim() || undefined,
      adminIds: adminUsers.map((u) => u.id),
      viewerIds: viewerUsers.map((u) => u.id),
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{project ? 'Edit Project' : 'Add Project'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

          <FormControl fullWidth>
            <InputLabel id="project-type-label">Type</InputLabel>
            <Select labelId="project-type-label" value={type} label="Type" onChange={(e) => setType(e.target.value as any)}>
              <MenuItem value="SAAS">SAAS</MenuItem>
              <MenuItem value="OFERTA">OFERTA</MenuItem>
              <MenuItem value="DEMANDA">DEMANDA</MenuItem>
            </Select>
          </FormControl>


          <Autocomplete
            multiple
            options={users}
            getOptionLabel={(u) => u.username || u.email || u.id}
            value={adminUsers}
            onChange={(_, val) => setAdminUsers(val)}
            renderInput={(params) => <TextField {...params} label={loadingUsers ? 'Loading users...' : 'Project admins'} />}
          />

          <Autocomplete
            multiple
            options={users}
            getOptionLabel={(u) => u.username || u.email || u.id}
            value={viewerUsers}
            onChange={(_, val) => setViewerUsers(val)}
            renderInput={(params) => <TextField {...params} label={loadingUsers ? 'Loading users...' : 'Project viewers'} />}
          />

          <Box>
            <Button variant="outlined" component="label">
              Anexar Imagem
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setImageUrl(reader.result as string)
                  reader.readAsDataURL(file)
                }}
              />
            </Button>
            {imageUrl ? <Box sx={{ mt: 1 }}><img src={imageUrl} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6 }} /></Box> : null}
          </Box>

          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={4} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProjectFormModal
