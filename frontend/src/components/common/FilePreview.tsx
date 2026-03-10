import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { presignGet } from '../../services/file.service'

type Props = {
  projectId?: string
  file?: File | null
  fileName?: string | null
  s3Key?: string | null
}

const FilePreview: React.FC<Props> = ({ projectId, file, fileName, s3Key }) => {
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState<string | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    try {
      if (s3Key && projectId) {
        const res = await presignGet(projectId, s3Key)
        setUrl(res.url)
      } else if (file) {
        setUrl(URL.createObjectURL(file))
      } else {
        setUrl(null)
      }
    } catch (e) {
      setUrl(null)
    }
  }

  const handleClose = () => {
    setOpen(false)
    if (url && file) {
      URL.revokeObjectURL(url)
    }
    setUrl(null)
  }

  return (
    <>
      <Tooltip title="Visualizar">
        <IconButton size="small" onClick={handleOpen} aria-label="visualizar">
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{fileName || 'Arquivo'}</DialogTitle>
        <DialogContent dividers>
          {url ? (
            // try to preview images and PDFs inline
            ((url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif')) ? (
              // image preview
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={url} alt={fileName || 'preview'} style={{ maxWidth: '100%' }} />
            ) : url.endsWith('.pdf') ? (
              <iframe title={fileName || 'preview'} src={url} width="100%" height={600} />
            ) : (
              <Typography>{fileName}</Typography>
            ))
          ) : (
            <Typography>Visualização indisponível</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {url ? (
            <Button href={url} target="_blank" rel="noreferrer" variant="contained">Abrir</Button>
          ) : null}
          <Button onClick={handleClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default FilePreview
