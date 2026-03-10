import React from 'react'
import { Box, Button, TextField, Paper, Typography, Alert, Divider } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import logoImg from '../images/logo.png'
import imageLogin from '../images/image_login.jpg'

const Login: React.FC = () => {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error_description || err?.message || 'Login failed')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520, mx: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            bgcolor: 'common.white',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box component="img" src={logoImg} alt="logo" sx={{ maxWidth: 260, width: '60%', mb: 3, display: 'block', mx: 'auto' }} />

          <Typography variant="h6" gutterBottom>
            {t('auth.login')}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handle} sx={{ mt: 2 }}>
            <TextField label={t('auth.username')} fullWidth value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />
            <TextField label={t('auth.password')} type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 1 }}>
              {t('auth.signIn')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default Login
