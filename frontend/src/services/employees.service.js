import api from './api';

export const employeesService = {
  getAll: (params) => api.get('/colaboradores', { params }),
  getById: (id) => api.get(`/colaboradores/${id}`),
  create: (data) => api.post('/colaboradores', data),
  update: (id, data) => api.put(`/colaboradores/${id}`, data),
  delete: (id) => api.delete(`/colaboradores/${id}`),
};