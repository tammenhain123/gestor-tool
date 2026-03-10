import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material'
import { getLeaderboard } from '../../services/user.service'
import { motion } from 'framer-motion'

export default function Leaderboard({ days = 7, limit = 5 }: { days?: number; limit?: number }) {
  const [items, setItems] = useState<Array<any>>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const data = await getLeaderboard(days, limit)
      if (!mounted) return

      // normalize response: backend should return an array, but be defensive
      let arr: Array<any> = []
      if (Array.isArray(data)) arr = data
      else if (data && Array.isArray((data as any).data)) arr = (data as any).data
      else arr = []

      if (!arr || arr.length === 0) {
        // demo fallback data so designer can validate layout
        const demo = Array.from({ length: limit }).map((_, i) => ({
          userId: `demo-${i + 1}`,
          username:
            ['Ana Silva', 'Carlos M.', 'Beatriz', 'Diego', 'Elena', 'Felipe', 'Gustavo', 'Helena', 'Igor', 'Joana'][i] || `User ${i + 1}`,
          companyName:
            ['ACME Ltd', 'Beta SA', 'Gamma LLC', 'ACME Ltd', 'Delta Pty', 'ACME Ltd', 'Beta SA', 'Gamma LLC', 'Delta Pty', 'ACME Ltd'][i] || '',
          score: Math.floor(200 - i * 12 + Math.random() * 40),
        }))
        setItems(demo)
      } else {
        setItems(arr)
      }
    })()
    return () => { mounted = false }
  }, [days, limit])

  return (
    <Paper elevation={3} sx={{ p: 2, width: 420 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Leaderboard (Top {limit})</Typography>
      <List>
        {(Array.isArray(items) ? items : []).map((it, idx) => (
          <motion.div key={it.userId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <ListItem sx={{ py: 1 }}>
              <ListItemAvatar>
                <Avatar>{String(it.username || it.userId).slice(0,1).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={it.username || it.userId} secondary={it.companyName ?? ''} />
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle1">{it.score}</Typography>
              </Box>
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Paper>
  )
}
