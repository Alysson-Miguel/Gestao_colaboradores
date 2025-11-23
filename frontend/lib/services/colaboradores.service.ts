import { api } from '../api';

export interface Colaborador {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  empresaId?: number;
  setorId?: number;
  cargoId?: number;
  dataAdmissao?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const colaboradoresService = {
  // Listar todos os colaboradores
  async getAll(): Promise<Colaborador[]> {
    return api.get('/api/colaboradores');
  },

  // Buscar colaborador por ID
  async getById(id: number): Promise<Colaborador> {
    return api.get(`/api/colaboradores/${id}`);
  },

  // Criar novo colaborador
  async create(data: Partial<Colaborador>): Promise<Colaborador> {
    return api.post('/api/colaboradores', data);
  },

  // Atualizar colaborador
  async update(id: number, data: Partial<Colaborador>): Promise<Colaborador> {
    return api.put(`/api/colaboradores/${id}`, data);
  },

  // Deletar colaborador
  async delete(id: number): Promise<void> {
    return api.delete(`/api/colaboradores/${id}`);
  },
};