import React from 'react'
import { Company } from '../../types/company'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type Props = {
  companies: Company[]
  loading?: boolean
  onEdit: (c: Company) => void
  onDelete: (c: Company) => void
}

const ColorDot: React.FC<{ color: string }> = ({ color }) => (
  <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: color, border: '1px solid #ddd' }} />
)

const CompanyTable: React.FC<Props> = ({ companies, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Logo</TableCell>
            <TableCell>Primary</TableCell>
            <TableCell>Secondary</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {companies.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell>
                <Typography variant="subtitle2">{c.name}</Typography>
              </TableCell>
              <TableCell>
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt={c.name} style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    —
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ColorDot color={c.primaryColor} />
                  <Typography variant="body2">{c.primaryColor}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ColorDot color={c.secondaryColor} />
                  <Typography variant="body2">{c.secondaryColor}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{c.active ? 'Active' : 'Inactive'}</Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(c)} aria-label="edit">
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(c)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default CompanyTable
