import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form)
}

export const fixNulls    = (session_id, strategy = 'auto', columns = null, custom_value = null) =>
  api.post('/fix/nulls', { session_id, strategy, columns, custom_value })

export const fixDuplicates = (session_id, subset = null) =>
  api.post('/fix/duplicates', { session_id, subset })

export const fixTypes    = (session_id) => api.post('/fix/types', { session_id })
export const fixSpelling = (session_id) => api.post('/fix/spelling', { session_id })
export const fixAll      = (session_id) => api.post('/fix/all', { session_id })

export const getReport   = (session_id) => api.get(`/report/${session_id}`)
export const getDashboard = (session_id) => api.get(`/dashboard/${session_id}`)
export const exportCsv   = (session_id) => `${api.defaults.baseURL}/export/${session_id}`

export default api
