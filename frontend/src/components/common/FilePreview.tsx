import React from 'react'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import Tooltip from '@mui/material/Tooltip'
import { presignGet } from '../../services/file.service'

type Props = {
  projectId?: string
  file?: File | null
  fileName?: string | null
  s3Key?: string | null
}

const FilePreview: React.FC<Props> = ({ projectId, file, fileName, s3Key }) => {
  const handleOpenDirect = async () => {
    try {
      let url: string | null = null
      if (s3Key && projectId) {
        const res = await presignGet(projectId, s3Key)
        url = res?.url || null
      } else if (file) {
        url = URL.createObjectURL(file)
      }

      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        // fallback alert if no preview available
        // eslint-disable-next-line no-alert
        alert('Visualização indisponível')
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Erro ao obter arquivo para visualização')
    }
  }

  const hasFile = !!(s3Key || file || fileName)

  return (
    <Tooltip title="Visualizar">
      <IconButton size="small" onClick={handleOpenDirect} aria-label="visualizar" color={hasFile ? 'primary' : undefined}>
        <VisibilityIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

export default FilePreview
