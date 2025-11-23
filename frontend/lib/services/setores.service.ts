import { api } from '../api';

export interface Setor {
  id: number;
  nome: string;
  descricao?: string;
  empresaId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const setoresService = {
  async getAll(): Promise<Setor[]> {
    return api.get('/api/setores');
  },

  async getById(id: number): Promise<Setor> {
    return api.get(`/api/setores/${id}`);
  },

  async create(data: Partial<Setor>): Promise<Setor> {
    return api.post('/api/setores', data);
  },

  async update(id: number, data: Partial<Setor>): Promise<Setor> {
    return api.put(`/api/setores/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/api/setores/${id}`);
  },
};