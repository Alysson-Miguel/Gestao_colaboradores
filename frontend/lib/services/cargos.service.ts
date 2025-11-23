import { api } from '../api';

export interface Cargo {
  id: number;
  nome: string;
  descricao?: string;
  nivel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const cargosService = {
  async getAll(): Promise<Cargo[]> {
    return api.get('/api/cargos');
  },

  async getById(id: number): Promise<Cargo> {
    return api.get(`/api/cargos/${id}`);
  },

  async create(data: Partial<Cargo>): Promise<Cargo> {
    return api.post('/api/cargos', data);
  },

  async update(id: number, data: Partial<Cargo>): Promise<Cargo> {
    return api.put(`/api/cargos/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/api/cargos/${id}`);
  },
};