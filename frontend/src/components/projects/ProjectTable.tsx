import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Project } from '../../types/project'

type Props = {
  projects: Project[]
  onEdit?: (p: Project) => void
  onDelete?: (p: Project) => void
  onOpen?: (p: Project) => void
  showActions?: boolean
  externalToast?: { type: 'success' | 'error'; message: string } | null
  clearExternalToast?: () => void
}

const ProjectTable: React.FC<Props> = ({ projects, onEdit, onDelete, onOpen, showActions = true, externalToast = null, clearExternalToast }) => {
  const [localToast, setLocalToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [target, setTarget] = React.useState<Project | null>(null)

  const handleCloseToast = () => {
    setLocalToast(null)
    if (clearExternalToast) clearExternalToast()
  }

  const openConfirm = (p: Project) => {
    setTarget(p)
    setConfirmOpen(true)
  }

  const closeConfirm = () => {
    setTarget(null)
    setConfirmOpen(false)
  }

  const confirmDelete = async () => {
    if (target && onDelete) {
      try {
        await onDelete(target)
        setLocalToast({ type: 'success', message: 'Projeto excluído' })
      } catch (e: any) {
        setLocalToast({ type: 'error', message: e?.message || 'Falha ao excluir' })
      }
    }
    closeConfirm()
  }
  const safeProjects = Array.isArray(projects) ? projects : []
  return (
    <TableContainer component={Paper}>
      {(localToast || externalToast) ? (
        <Snackbar open={!!(localToast || externalToast)} autoHideDuration={4000} onClose={handleCloseToast}>
          {localToast ? (
            <Alert severity={localToast.type} onClose={handleCloseToast}>{localToast.message}</Alert>
          ) : externalToast ? (
            <Alert severity={externalToast.type} onClose={handleCloseToast}>{externalToast.message}</Alert>
          ) : null}
        </Snackbar>
      ) : null}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Logo</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Creator</TableCell>
            <TableCell>Users</TableCell>
            {showActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {safeProjects.map((p) => (
            <TableRow key={p.id} hover>
              <TableCell>
                <Typography variant="subtitle2">{p.name}</Typography>
              </TableCell>
              <TableCell>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">—</Typography>
                )}
              </TableCell>
              <TableCell>{p.type}</TableCell>
              <TableCell>{p.company?.name}</TableCell>
              <TableCell>{p.creator?.username || p.creator?.id}</TableCell>
              <TableCell>{p.users?.length ?? 0}</TableCell>
              <TableCell align="right">
                {showActions && (
                  <>
                    <IconButton size="small" onClick={() => { onEdit && onEdit(p); setLocalToast({ type: 'success', message: 'Editando projeto' }) }} aria-label="edit"><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => openConfirm(p)} aria-label="delete"><DeleteIcon /></IconButton>
                  </>
                )}
                {/* open/detail icon */}
                {onOpen && (
                  <IconButton size="small" onClick={() => onOpen(p)} aria-label="open" sx={{ ml: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3h7v7"/><path d="M10 14L21 3"/></svg>
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={confirmOpen} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6">Confirmação de exclusão</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Deseja realmente excluir?
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 500, color: 'text.secondary' }}>
            Essa ação não pode ser revertida.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  )
}

export default ProjectTable

