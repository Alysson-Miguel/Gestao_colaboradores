import { api } from '../api';

export interface Empresa {
  id: number;
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const empresasService = {
  async getAll(): Promise<Empresa[]> {
    return api.get('/api/empresas');
  },

  async getById(id: number): Promise<Empresa> {
    return api.get(`/api/empresas/${id}`);
  },

  async create(data: Partial<Empresa>): Promise<Empresa> {
    return api.post('/api/empresas', data);
  },

  async update(id: number, data: Partial<Empresa>): Promise<Empresa> {
    return api.put(`/api/empresas/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/api/empresas/${id}`);
  },
};
