import request from '@/utils/request'

export const userApi = {
  register: (data: { username: string; password: string }) =>
    request.post('/api/user/register', data),
  login: (data: { username: string; password: string }) =>
    request.post('/api/user/login', data)
}

export const checkInApi = {
  create: (data: FormData) =>
    request.post('/api/check-in', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }),
  list: (params: { page?: number; size?: number; keyword?: string; mood?: string; startDate?: string; endDate?: string }) =>
    request.get('/api/check-in/list', { params }),
  detail: (id: number) =>
    request.get(`/api/check-in/${id}`)
}

export const statisticsApi = {
  get: () =>
    request.get('/api/statistics')
}