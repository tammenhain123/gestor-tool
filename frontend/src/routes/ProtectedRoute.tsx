import React from 'react'
import { useAuth } from '../auth/AuthProvider'
import Loading from '../components/Loading'
import { Navigate } from 'react-router-dom'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <Loading />

  // allow either a real token OR a local dev login (db_user_id stored)
  const hasLocalDbId = typeof window !== 'undefined' && !!localStorage.getItem('db_user_id')
  if (!isAuthenticated && !hasLocalDbId) {
    // If OAuth callback is in progress, show loading so we don't redirect.
    const href = window.location.href
    const isCallback = /(?:[?#].*(?:code=|state=|session_state=|error=))/i.test(href)
    if (isCallback) return <Loading />

    // Declarative redirect so router replaces the location and Layout is
    // unmounted (no flash of AppBar).
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
