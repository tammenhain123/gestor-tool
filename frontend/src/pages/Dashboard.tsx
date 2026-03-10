import React, { useEffect, useState } from 'react'
import { Typography, Paper, Box, Card, CardMedia, CardContent, CardActions, IconButton, Chip, Stack, Tooltip, LinearProgress } from '@mui/material'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip, CartesianGrid } from 'recharts'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import jwtDecode from 'jwt-decode'
import { extractRolesFromTokenPayload } from '../utils/tokenRoles'
import api from '../services/api'
import * as companyService from '../services/company.service'
import * as projectService from '../services/project.service'
import { Project } from '../types/project'
import CompletionDonut from '../components/projects/CompletionDonut'
import Leaderboard from '../components/admin/Leaderboard'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import { motion } from 'framer-motion'
import { getActiveSummary } from '../services/user.service'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await projectService.getProjects()
        // normalize API response: ensure we always set an array
        let arr: Project[] = []
        if (Array.isArray(data)) arr = data
        else if (data && Array.isArray((data as any).data)) arr = (data as any).data
        else arr = []
        if (mounted) setProjects(arr)
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const buckets = React.useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ key, label: d.toLocaleString(undefined, { month: 'short' }), count: 0 })
    }
    projects.forEach((p) => {
      try {
        const d = new Date(p.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const m = months.find((x) => x.key === key)
        if (m) m.count++
      } catch (e) {}
    })
    return months
  }, [projects])

  const total = projects.length

  // show 3 projects per page in the carousel
  const PER_PAGE = 3
  const [currentPage, setCurrentPage] = React.useState(0)
  const pageCount = Math.max(1, Math.ceil(projects.length / PER_PAGE))
  React.useEffect(() => {
    if (currentPage >= pageCount) setCurrentPage(0)
  }, [pageCount])

  const prev = () => setCurrentPage((p) => (pageCount ? (p - 1 + pageCount) % pageCount : 0))
  const next = () => setCurrentPage((p) => (pageCount ? (p + 1) % pageCount : 0))

  const thisMonth = buckets[buckets.length - 1]?.count ?? 0
  const navigate = useNavigate()
  const { token } = useAuth()

  const [isMaster, setIsMaster] = React.useState(false)
  const [companiesCount, setCompaniesCount] = React.useState<number | null>(null)
  const [usersTotal, setUsersTotal] = React.useState<number | null>(null)
  const [usersActive, setUsersActive] = React.useState<number | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        let master = false
        const dbId = localStorage.getItem('db_user_id')
        if (dbId) {
          const res = await api.get(`/users/${dbId}`)
          const db = res?.data
          if (db && db.role) master = String(db.role).toUpperCase() === 'MASTER'
        } else {
          const useToken = token ?? (() => {
            const stored = localStorage.getItem('auth') || sessionStorage.getItem('auth')
            if (!stored) return null
            const parsed = JSON.parse(stored)
            return parsed?.access_token
          })()
          if (useToken) {
            const payload: any = jwtDecode(useToken)
            const roles = extractRolesFromTokenPayload(payload).map((r) => String(r).toUpperCase())
            master = roles.includes('MASTER')
          }
        }

        if (!mounted) return
        setIsMaster(master)

        if (master) {
          const comps = await companyService.getCompanies()
          if (!mounted) return
          setCompaniesCount(comps.length)
          // load users summary for master
          try {
            const s = await getActiveSummary()
            if (!mounted) return
            setUsersTotal(s.total)
            setUsersActive(s.active)
          } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [token])

  // Wrapper component to ensure Tooltip can attach event handlers/ref to a DOM node
  const NoForwardSpan = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ children, style, ...rest }, ref) => {
    const { interactive, ...domProps } = rest as any
    return <span ref={ref} style={style} {...domProps}>{children}</span>
  })
  NoForwardSpan.displayName = 'NoForwardSpan'

  // load users summary for non-master (admins and others). separate effect so it refreshes
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await getActiveSummary()
        if (!mounted) return
        setUsersTotal(s.total)
        setUsersActive(s.active)
      } catch (e) {}
    })()
    return () => { mounted = false }
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        {t('dashboard.title')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {/* Projects carousel showing projects for the current user's company */}
        <Paper elevation={3} sx={{ p: 2, width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={prev} aria-label="previous" size="large"><ArrowBackIosIcon /></IconButton>

                {projects.length === 0 ? (
              <Box sx={{ flex: 1, py: 4, textAlign: 'center' }}>
                <Typography variant="body1">{t('dashboard_extra_local.noProjects')}</Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
                  {projects.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE).map((proj) => (
                    <Tooltip
                      key={proj.id}
                      title={(
                        <Box sx={{ p: 2, width: 320, maxWidth: '90vw', maxHeight: 300, overflow: 'auto' }}>
                          <Typography variant="subtitle1" sx={{ mb: 1 }}>{proj.name} — progress details</Typography>
                          {[
                            'Overview','Details','Images','Team','Milestones','Budget','Docs','Tasks','QA'
                          ].map((label, i) => {
                            const sample = [80,55,40,70,25,60,45,30,50][i] ?? 50
                            return (
                              <Box key={label} sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption">{label}</Typography>
                                  <Typography variant="caption">{sample}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={sample} sx={{ height: 8, borderRadius: 1 }} />
                              </Box>
                            )
                          })}
                        </Box>
                      )}
                      arrow
                      placement="bottom"
                      interactive
                      PopperProps={{
                        modifiers: [
                          { name: 'offset', options: { offset: [0, 12] } },
                          { name: 'preventOverflow', options: { boundary: 'viewport' } }
                        ]
                      }}
                    >
                            <NoForwardSpan style={{ display: 'inline-block' }}>
                        <Card sx={{ width: 320, cursor: 'pointer', minHeight: 360 }} onClick={() => { navigate(`/projects/${proj.id}`) }}>
                        {proj?.imageUrl ? (
                          <CardMedia component="img" height="140" image={proj.imageUrl} alt={proj.name} />
                        ) : (
                          <Box sx={{ height: 140, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="caption" color="text.secondary">{t('projectDetail.noImage')}</Typography>
                          </Box>
                        )}
                        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">{proj.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxHeight: 64, overflow: 'hidden' }}>{proj.description ?? '—'}</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip label={proj.type} size="small" />
                              <Chip label={proj.company?.name} size="small" />
                            </Stack>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <CompletionDonut percent={70} size={96} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>{t('dashboard_extra_local.fieldsFilled')}</Typography>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Typography variant="caption" sx={{ ml: 1 }}>{new Date(proj.createdAt).toLocaleDateString()}</Typography>
                        </CardActions>
                        </Card>
                      </NoForwardSpan>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            )}

            <IconButton onClick={next} aria-label="next" size="large"><ArrowForwardIosIcon /></IconButton>
          </Box>

          {/* indicators */}
          {projects.length > PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
              {Array.from({ length: pageCount }).map((_, i) => (
                <Box key={i} onClick={() => setCurrentPage(i)} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === currentPage ? 'primary.main' : 'grey.400', cursor: 'pointer' }} />
              ))}
            </Box>
          )}
        </Paper>
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.6 } } }} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <motion.div whileHover={{ scale: 1.02, y: -6 }} variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 1.1 } } }}>
            <Paper elevation={3} sx={{ p: 2, width: 280, height: 160, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon />
                <Typography variant="subtitle2">{t('dashboard_extra_local.totalUsers')}</Typography>
              </Box>
              <Typography variant="h4">{usersTotal === null ? '...' : usersTotal}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('dashboard_extra_local.allUsersScope')}</Typography>
            </Paper>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -6 }} variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 1.1 } } }}>
            <Paper elevation={3} sx={{ p: 2, width: 280, height: 160, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: 'success.main' }} />
                <Typography variant="subtitle2">{t('dashboard_extra_local.activeUsers')}</Typography>
              </Box>
              <Typography variant="h4">{usersActive === null ? '...' : usersActive}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('dashboard_extra_local.last30Minutes')}</Typography>
            </Paper>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02, y: -6 }} variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 1.1 } } }}>
            <Paper
              elevation={3}
              onClick={() => navigate('/projects')}
              role="button"
              tabIndex={0}
              sx={{
                p: 2,
                width: 280,
                height: 160,
                boxSizing: 'border-box',
                overflow: 'hidden',
                bgcolor: '#1976d2',
                color: 'white',
                transition: 'transform 220ms ease, box-shadow 220ms ease',
                '&:hover': { transform: 'translateY(-6px) scale(1.02)', boxShadow: 6 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderOpenIcon sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h6">{t('dashboard.projectsCardTitle') || t('nav.projects')}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                <Box>
                  <Typography variant="h3">{loading ? '...' : total}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('dashboard.overview') || 'Projects overview'}</Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5">{thisMonth}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('dashboard.thisMonth') || 'This month'}</Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>
          {isMaster && (
            <motion.div whileHover={{ scale: 1.02, y: -6 }} variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 1.1 } } }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  width: 240,
                  height: 140,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  bgcolor: '#1976d2',
                  color: 'white',
                  transition: 'transform 220ms ease, boxShadow 220ms ease',
                  '&:hover': { transform: 'translateY(-6px) scale(1.02)', boxShadow: 6 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderOpenIcon sx={{ fontSize: 36 }} />
                  <Box>
                    <Typography variant="h6">{t('nav.companies')}</Typography>
                    <Typography variant="caption">{t('dashboard.overview')}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="h3">{companiesCount ?? '...'}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('dashboard.companiesLabel') || ''}</Typography>
                  </Box>
                  <Box />
                </Box>
              </Paper>
            </motion.div>
          )}

          {/* Chart placed in a separate full-width panel below; keep space reserved next to card */}
          <Box sx={{ flex: 1, minWidth: 520 }} />

        </motion.div>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, width: '40vw', maxWidth: '100%' }}>
          <Typography variant="subtitle2">{t('dashboard.projectsPerMonth')}</Typography>
          <Box sx={{ height: 220, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets.map((b) => ({ name: b.label, count: b.count }))} margin={{ top: 10, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartTooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
        <Leaderboard />
      </Box>
    </Box>
  )
}

export default Dashboard
