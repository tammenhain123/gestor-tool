import axios, { AxiosInstance } from 'axios'

export const api: AxiosInstance = axios.create({
  // Use the `/api` prefix so Vite dev server proxies requests to the backend
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export function attachTokenInterceptor(getToken: () => string | null | undefined) {
  api.interceptors.request.use((config) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // If no token, try to send DB user id so backend can accept local auth
    try {
      if (config.headers && !config.headers.Authorization) {
        const dbId = localStorage.getItem('db_user_id') || sessionStorage.getItem('db_user_id')
        if (dbId) config.headers['X-DB-USER-ID'] = dbId
      }
    } catch (e) {
      // ignore storage access errors
    }
    return config
  })
}

// Default interceptor: always attempt to send `X-DB-USER-ID` from storage
// so client requests include the header even before AuthProvider attaches
// the token interceptor (avoids race on first load/refresh).
api.interceptors.request.use((config) => {
  try {
    if (config.headers && !config.headers.Authorization) {
      const dbId = localStorage.getItem('db_user_id') || sessionStorage.getItem('db_user_id')
      if (dbId) config.headers['X-DB-USER-ID'] = dbId
    }
  } catch (e) {
    // ignore
  }
  return config
})

export default api
