import React from 'react'
import { Outlet, Link as RouterLink } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import BusinessIcon from '@mui/icons-material/Business'
import PeopleIcon from '@mui/icons-material/People'
import BarChartIcon from '@mui/icons-material/BarChart'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import Badge from '@mui/material/Badge'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useAuth } from '../auth/AuthProvider'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import notificationService from '../services/notification.service'
import Select from '@mui/material/Select'
import jwtDecode from 'jwt-decode'
import { extractRolesFromTokenPayload } from '../utils/tokenRoles'

const drawerWidth = 240

const Layout: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const { user, logout, token } = useAuth()
  const { t, i18n } = useTranslation()

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lang', lng)
  }

  const [notifAnchor, setNotifAnchor] = React.useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = React.useState<{ id: string; text: string; read?: boolean }[]>(() => {
    try {
      const raw = localStorage.getItem('notifications')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const openNotifs = (e: React.MouseEvent<HTMLElement>) => setNotifAnchor(e.currentTarget)
  const closeNotifs = () => setNotifAnchor(null)

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updated)
    localStorage.setItem('notifications', JSON.stringify(updated))
  }

  const clearAll = () => {
    setNotifications([])
    localStorage.removeItem('notifications')
    closeNotifs()
  }

  // fetch server notifications and merge with local ones
  React.useEffect(() => {
    let mounted = true
    const loadServer = async () => {
      try {
        const remote = await notificationService.fetchNotifications()
        if (!mounted) return
        const mapped = remote.map((r) => ({ id: r.id, text: r.message, read: r.read }))
        // merge by id, prefer server items and keep local ones
        const byId = new Map<string, { id: string; text: string; read?: boolean }>()
        mapped.forEach((m) => byId.set(m.id, m))
        notifications.forEach((l) => { if (!byId.has(l.id)) byId.set(l.id, l) })
        const merged = Array.from(byId.values())
        setNotifications(merged)
        localStorage.setItem('notifications', JSON.stringify(merged))
      } catch (e) {
        // ignore
      }
    }
    loadServer()
    return () => { mounted = false }
  }, [token])

  const roles = React.useMemo(() => {
    try {
      const useToken = token ?? (() => {
          const stored = localStorage.getItem('auth') || sessionStorage.getItem('auth')
          if (!stored) return null
          const parsed = JSON.parse(stored)
          return parsed?.access_token
        })()
        if (!useToken) return []
        const payload: any = jwtDecode(useToken)
        return extractRolesFromTokenPayload(payload)
    } catch {
      return []
    }
  }, [token])

  const [localRole, setLocalRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const dbId = localStorage.getItem('db_user_id')
        if (dbId) {
          const res = await api.get(`/users/${dbId}`)
          if (!mounted) return
          const db = res?.data
          if (db && db.role) return setLocalRole(String(db.role).toUpperCase())
        }

        // fallback to /users/me if no db id present
        const res2 = await api.get('/users/me')
        if (!mounted) return
        const db2 = res2?.data?.db
        if (db2 && db2.role) setLocalRole(String(db2.role).toUpperCase())
      } catch (e) {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [token])

  const normalizedRoles = roles.map((r) => String(r).toUpperCase())
  const effectiveRoles = localRole ? [localRole] : normalizedRoles
  const isMaster = effectiveRoles.includes('MASTER')
  const isAdmin = effectiveRoles.includes('ADMIN')

  console.log('[Layout] user=', user, 'roles=', effectiveRoles)

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.username}
          </Typography>
          <Select value={i18n.language} size="small" onChange={(e) => changeLang(String(e.target.value))} sx={{ color: 'white', mr: 2 }}>
            <MenuItem value="pt">PT</MenuItem>
            <MenuItem value="en">EN</MenuItem>
          </Select>
          <IconButton color="inherit" onClick={openNotifs} size="large">
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
          <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={closeNotifs} sx={{ mt: '45px' }}>
            <MenuItem disabled>
              {t('notifications.title')}
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={markAllRead}>{t('notifications.markAllRead')}</Button>
            </MenuItem>
            <Divider />
            {notifications.length === 0 && <MenuItem disabled>{t('notifications.noNotifications')}</MenuItem>}
            {notifications.map((n) => (
              <MenuItem key={n.id} onClick={async () => {
                try {
                  await notificationService.markRead(n.id)
                } catch (e) {
                  // ignore
                }
                const updated = notifications.map((x) => x.id === n.id ? { ...x, read: true } : x)
                setNotifications(updated)
                localStorage.setItem('notifications', JSON.stringify(updated))
                closeNotifs()
              }} selected={!n.read}>
                {n.text}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={clearAll} sx={{ justifyContent: 'center' }}>{t('notifications.clearAll')}</MenuItem>
          </Menu>

          <Button color="inherit" onClick={() => logout()}>
            {t('auth.logout')}
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)} variant="temporary">
        <Box sx={{ width: drawerWidth }} role="presentation" onClick={() => setOpen(false)}>
          <Toolbar />
          <List>
            <ListItem button component={RouterLink} to="/dashboard">
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.dashboard')} />
            </ListItem>
            {isMaster && (
              <ListItem button component={RouterLink} to="/admin/companies">
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText primary={t('companies.title')} />
              </ListItem>
            )}
            {(isMaster || isAdmin) && (
              <ListItem button component={RouterLink} to="/admin/users">
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.users')} />
              </ListItem>
            )}
            {(isMaster || isAdmin) ? (
              <ListItem button component={RouterLink} to="/admin/projects">
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.projects')} />
              </ListItem>
            ) : (
              <ListItem button component={RouterLink} to="/projects">
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.projects')} />
              </ListItem>
            )}
            <ListItem button component={RouterLink} to="/diligences">
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.diligences') || 'Diligences'} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout
