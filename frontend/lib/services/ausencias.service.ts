import { api } from '../api';

export interface Ausencia {
  id: number;
  colaboradorId: number;
  dataInicio: string;
  dataFim: string;
  tipo: string;
  motivo?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ausenciasService = {
  async getAll(): Promise<Ausencia[]> {
    return api.get('/api/ausencias');
  },

  async getById(id: number): Promise<Ausencia> {
    return api.get(`/api/ausencias/${id}`);
  },

  async getByColaborador(colaboradorId: number): Promise<Ausencia[]> {
    return api.get(`/api/ausencias/colaborador/${colaboradorId}`);
  },

  async create(data: Partial<Ausencia>): Promise<Ausencia> {
    return api.post('/api/ausencias', data);
  },

  async update(id: number, data: Partial<Ausencia>): Promise<Ausencia> {
    return api.put(`/api/ausencias/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/api/ausencias/${id}`);
  },
};