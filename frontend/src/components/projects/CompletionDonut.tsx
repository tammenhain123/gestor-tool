import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

type Props = {
  percent: number
  size?: number
}

export default function CompletionDonut({ percent, size = 88 }: Props) {
  const theme = useTheme()
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (p / 100) * circumference

  // color rules: <30 red, 30-60 yellow, >60 theme primary
  const color = p < 30 ? '#d32f2f' : p <= 60 ? '#fbc02d' : theme.palette.primary.main

  return (
    <Box sx={{ width: size, height: size, position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="none" stroke="#e6e6e6" strokeWidth={stroke} />
          <circle
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90)"
            style={{ filter: 'url(#shadow)' }}
          />
        </g>
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ color: color, fontWeight: 600 }}>{p}%</Typography>
      </Box>
    </Box>
  )
}
