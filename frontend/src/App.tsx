import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Login from './pages/Login'
import CompaniesPage from './pages/admin/CompaniesPage'
import UsersPage from './pages/admin/UsersPage'
import ProjectsPage from './pages/admin/ProjectsPage'
import ProjectsPublic from './pages/ProjectsPublic'
import DiligencesPage from './pages/Diligences'
import ProjectDetail from './pages/ProjectDetail'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/companies"
          element={
            <ProtectedRoute>
              <CompaniesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects"
          element={
            <ProtectedRoute>
              <ProjectsPublic />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="diligences"
          element={
            <ProtectedRoute>
              <DiligencesPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
