import { api } from '../api';

export interface Frequencia {
  id: number;
  colaboradorId: number;
  data: string;
  horaEntrada?: string;
  horaSaida?: string;
  tipo?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const frequenciasService = {
  async getAll(): Promise<Frequencia[]> {
    return api.get('/api/frequencias');
  },

  async getById(id: number): Promise<Frequencia> {
    return api.get(`/api/frequencias/${id}`);
  },

  async getByColaborador(colaboradorId: number): Promise<Frequencia[]> {
    return api.get(`/api/frequencias/colaborador/${colaboradorId}`);
  },

  async create(data: Partial<Frequencia>): Promise<Frequencia> {
    return api.post('/api/frequencias', data);
  },

  async update(id: number, data: Partial<Frequencia>): Promise<Frequencia> {
    return api.put(`/api/frequencias/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/api/frequencias/${id}`);
  },
};