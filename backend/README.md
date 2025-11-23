# 🚀 Backend Node.js - Sistema de Gestão de Colaboradores

Backend completo em **Node.js** com **Express**, **PostgreSQL** e **Prisma ORM** para sistema de gestão de colaboradores, frequência e ausências.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Executando o Projeto](#executando-o-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Autenticação](#autenticação)
- [Modelos de Dados](#modelos-de-dados)

---

## ✨ Características

- ✅ **Autenticação JWT** completa (login, registro, middleware)
- ✅ **CRUD completo** para todas as entidades do sistema
- ✅ **Arquitetura limpa** e modular (Controllers, Routes, Middlewares, Utils)
- ✅ **Prisma ORM** para gerenciamento do banco de dados
- ✅ **Validação de dados** com express-validator
- ✅ **Tratamento de erros** centralizado
- ✅ **Logs estruturados** para debugging
- ✅ **Respostas padronizadas** (success, error, pagination)
- ✅ **Controle de acesso** baseado em roles (USER, ADMIN, MANAGER)
- ✅ **Paginação** em todas as listagens
- ✅ **Filtros avançados** para consultas
- ✅ **Relacionamentos complexos** entre entidades
- ✅ **Seeds** para dados iniciais

---

## 🛠️ Tecnologias

- **Node.js** v18+
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **Prisma ORM** - ORM moderno para Node.js
- **JWT** - Autenticação stateless
- **bcryptjs** - Hash de senhas
- **express-validator** - Validação de dados
- **cors** - Controle de CORS
- **helmet** - Segurança HTTP
- **morgan** - Logger HTTP
- **dotenv** - Variáveis de ambiente

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** v18 ou superior ([Download](https://nodejs.org/))
- **PostgreSQL** v14 ou superior ([Download](https://www.postgresql.org/download/))
- **npm** ou **yarn** (vem com Node.js)
- **Git** (opcional, para clonar o repositório)

---

## 📥 Instalação

### Passo 1: Criar o diretório do projeto

```bash
mkdir backend-nodejs-complete
cd backend-nodejs-complete
```

### Passo 2: Copiar os arquivos

Copie todos os arquivos na seguinte ordem de pastas:

```
backend-nodejs-complete/
├── package.json                          # Copiar primeiro
├── .env.example                          # Copiar e renomear para .env
├── .gitignore
├── prisma/
│   ├── schema.prisma                     # Schema do banco de dados
│   └── seed.js                           # Dados iniciais
├── src/
│   ├── config/
│   │   ├── config.js                     # Configurações gerais
│   │   └── database.js                   # Conexão Prisma
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── colaborador.controller.js
│   │   ├── empresa.controller.js
│   │   ├── setor.controller.js
│   │   ├── cargo.controller.js
│   │   ├── frequencia.controller.js
│   │   ├── ausencia.controller.js
│   │   ├── tipoausencia.controller.js
│   │   ├── turno.controller.js
│   │   ├── escala.controller.js
│   │   ├── estacao.controller.js
│   │   └── contrato.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js            # Autenticação JWT
│   │   ├── validate.middleware.js        # Validação
│   │   └── error.middleware.js           # Tratamento de erros
│   ├── routes/
│   │   ├── index.js                      # Agregador de rotas
│   │   ├── auth.routes.js
│   │   ├── colaborador.routes.js
│   │   ├── empresa.routes.js
│   │   ├── setor.routes.js
│   │   ├── cargo.routes.js
│   │   ├── frequencia.routes.js
│   │   ├── ausencia.routes.js
│   │   ├── tipoausencia.routes.js
│   │   ├── turno.routes.js
│   │   ├── escala.routes.js
│   │   ├── estacao.routes.js
│   │   └── contrato.routes.js
│   ├── utils/
│   │   ├── logger.js                     # Sistema de logs
│   │   ├── response.js                   # Respostas padronizadas
│   │   ├── jwt.js                        # Utilitários JWT
│   │   └── hash.js                       # Hash de senha
│   ├── app.js                            # Configuração Express
│   └── server.js                         # Inicialização do servidor
└── README.md
```

### Passo 3: Instalar dependências

```bash
npm install
```

---

## ⚙️ Configuração

### 1. Configurar o Banco de Dados PostgreSQL

Crie um banco de dados no PostgreSQL:

```sql
CREATE DATABASE gestao_colaboradores;
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do Servidor
NODE_ENV=development
PORT=3000

# Configurações do Banco de Dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gestao_colaboradores?schema=public"

# Configurações JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui_mude_em_producao
JWT_EXPIRES_IN=7d

# Configurações de CORS
CORS_ORIGIN=http://localhost:5173

# Configurações de Log
LOG_LEVEL=info
```

⚠️ **IMPORTANTE**: Substitua `usuario` e `senha` pelas credenciais do seu PostgreSQL.

### 3. Gerar o Prisma Client e executar as migrations

```bash
# Gera o Prisma Client
npx prisma generate

# Cria as tabelas no banco de dados
npx prisma migrate dev --name init
```

### 4. Popular o banco de dados com dados iniciais

```bash
npm run prisma:seed
```

Isso irá criar:
- ✅ Usuário administrador (email: `admin@sistema.com`, senha: `admin123`)
- ✅ Todos os tipos de ausência (16 tipos)
- ✅ Dados de exemplo (empresa, setor, cargo, turno, escala)

---

## 📂 Estrutura de Pastas Detalhada

```
backend-nodejs-complete/
│
├── prisma/                           # Configuração do Prisma
│   ├── schema.prisma                 # Schema do banco (modelos e relacionamentos)
│   ├── seed.js                       # Seeds para dados iniciais
│   └── migrations/                   # Migrations do banco (geradas automaticamente)
│
├── src/                              # Código fonte da aplicação
│   │
│   ├── config/                       # Arquivos de configuração
│   │   ├── config.js                 # Configurações gerais (env, jwt, cors)
│   │   └── database.js               # Configuração do Prisma Client
│   │
│   ├── controllers/                  # Lógica de negócio (CRUD)
│   │   ├── auth.controller.js        # Autenticação (login, register)
│   │   ├── colaborador.controller.js # CRUD de colaboradores
│   │   ├── empresa.controller.js     # CRUD de empresas
│   │   ├── setor.controller.js       # CRUD de setores
│   │   ├── cargo.controller.js       # CRUD de cargos
│   │   ├── frequencia.controller.js  # CRUD de frequências
│   │   ├── ausencia.controller.js    # CRUD de ausências
│   │   └── ...                       # Outros controllers
│   │
│   ├── middlewares/                  # Middlewares personalizados
│   │   ├── auth.middleware.js        # Autenticação JWT e autorização
│   │   ├── validate.middleware.js    # Validação de dados
│   │   └── error.middleware.js       # Tratamento de erros global
│   │
│   ├── routes/                       # Definição de rotas
│   │   ├── index.js                  # Agregador de todas as rotas
│   │   ├── auth.routes.js            # Rotas de autenticação
│   │   ├── colaborador.routes.js     # Rotas de colaboradores
│   │   └── ...                       # Outras rotas
│   │
│   ├── utils/                        # Utilitários e helpers
│   │   ├── logger.js                 # Sistema de logs coloridos
│   │   ├── response.js               # Respostas HTTP padronizadas
│   │   ├── jwt.js                    # Geração e verificação de tokens
│   │   └── hash.js                   # Hash e comparação de senhas
│   │
│   ├── app.js                        # Configuração do Express
│   └── server.js                     # Inicialização do servidor
│
├── .env                              # Variáveis de ambiente (NÃO commitar!)
├── .env.example                      # Exemplo de variáveis de ambiente
├── .gitignore                        # Arquivos ignorados pelo Git
├── package.json                      # Dependências e scripts
└── README.md                         # Documentação (este arquivo)
```

---

## 🚀 Executando o Projeto

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

O servidor estará rodando em: **http://localhost:3000**

### Verificar se está funcionando

Acesse: **http://localhost:3000/api/health**

Resposta esperada:
```json
{
  "success": true,
  "message": "API está funcionando!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

---

## 📡 Endpoints da API

### Base URL
```
http://localhost:3000/api
```

### 🔐 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register` | Registrar novo usuário | ❌ |
| POST | `/auth/login` | Login | ❌ |
| GET | `/auth/me` | Dados do usuário logado | ✅ |
| PUT | `/auth/me` | Atualizar perfil | ✅ |
| PUT | `/auth/change-password` | Alterar senha | ✅ |

### 👥 Colaboradores (`/api/colaboradores`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/colaboradores` | Listar colaboradores | ✅ | Todos |
| GET | `/colaboradores/:opsId` | Buscar colaborador | ✅ | Todos |
| GET | `/colaboradores/:opsId/stats` | Estatísticas | ✅ | Todos |
| GET | `/colaboradores/:opsId/historico` | Histórico | ✅ | Todos |
| POST | `/colaboradores` | Criar colaborador | ✅ | ADMIN, MANAGER |
| PUT | `/colaboradores/:opsId` | Atualizar colaborador | ✅ | ADMIN, MANAGER |
| DELETE | `/colaboradores/:opsId` | Deletar colaborador | ✅ | ADMIN |

### 🏢 Empresas (`/api/empresas`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/empresas` | Listar empresas | ✅ | Todos |
| GET | `/empresas/:id` | Buscar empresa | ✅ | Todos |
| GET | `/empresas/:id/stats` | Estatísticas | ✅ | Todos |
| POST | `/empresas` | Criar empresa | ✅ | ADMIN |
| PUT | `/empresas/:id` | Atualizar empresa | ✅ | ADMIN |
| DELETE | `/empresas/:id` | Deletar empresa | ✅ | ADMIN |

### 📊 Frequências (`/api/frequencias`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/frequencias` | Listar frequências | ✅ | Todos |
| GET | `/frequencias/:id` | Buscar frequência | ✅ | Todos |
| POST | `/frequencias` | Registrar frequência | ✅ | ADMIN, MANAGER |
| PUT | `/frequencias/:id` | Atualizar frequência | ✅ | ADMIN, MANAGER |
| PUT | `/frequencias/:id/validar` | Validar frequência | ✅ | ADMIN, MANAGER |
| DELETE | `/frequencias/:id` | Deletar frequência | ✅ | ADMIN |

### 📅 Ausências (`/api/ausencias`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/ausencias` | Listar ausências | ✅ | Todos |
| GET | `/ausencias/ativas` | Ausências ativas | ✅ | Todos |
| GET | `/ausencias/:id` | Buscar ausência | ✅ | Todos |
| POST | `/ausencias` | Registrar ausência | ✅ | ADMIN, MANAGER |
| PUT | `/ausencias/:id` | Atualizar ausência | ✅ | ADMIN, MANAGER |
| PUT | `/ausencias/:id/finalizar` | Finalizar ausência | ✅ | ADMIN, MANAGER |
| DELETE | `/ausencias/:id` | Deletar ausência | ✅ | ADMIN |

**Endpoints similares existem para:**
- `/api/setores` - Setores
- `/api/cargos` - Cargos
- `/api/estacoes` - Estações
- `/api/contratos` - Contratos
- `/api/escalas` - Escalas de trabalho
- `/api/turnos` - Turnos
- `/api/tipos-ausencia` - Tipos de ausência

---

## 🔐 Autenticação

### 1. Fazer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }'
```

Resposta:
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Administrador",
      "email": "admin@sistema.com",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Usar o Token

Inclua o token no header `Authorization` de todas as requisições protegidas:

```bash
curl -X GET http://localhost:3000/api/colaboradores \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📊 Modelos de Dados

### Principais Entidades:

1. **User** - Usuários do sistema (login)
2. **Empresa** - Empresas cadastradas
3. **Setor** - Setores das empresas
4. **Cargo** - Cargos dos colaboradores
5. **Estacao** - Locais de trabalho
6. **Contrato** - Contratos das empresas
7. **Escala** - Escalas de trabalho (5x2, 6x1, etc)
8. **Turno** - Turnos de trabalho
9. **Colaborador** - Colaboradores (principal)
10. **TipoAusencia** - Tipos de ausência
11. **Frequencia** - Registro diário de ponto
12. **Ausencia** - Ausências prolongadas
13. **HistoricoMovimentacao** - Histórico de mudanças

---

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento com auto-reload
npm run dev

# Produção
npm start

# Gerar Prisma Client
npm run prisma:generate

# Criar migration
npm run prisma:migrate

# Executar seed
npm run prisma:seed

# Abrir Prisma Studio (GUI para ver o banco)
npm run prisma:studio
```

---

## 📝 Exemplo de Requisições

### Criar um Colaborador

```bash
curl -X POST http://localhost:3000/api/colaboradores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "opsId": "OPS001",
    "nomeCompleto": "João Silva",
    "genero": "Masculino",
    "matricula": "MAT001",
    "dataAdmissao": "2024-01-15",
    "horarioInicioJornada": "08:00:00",
    "idSetor": 1,
    "idCargo": 1,
    "idEmpresa": 1,
    "idTurno": 1,
    "status": "ATIVO"
  }'
```

### Registrar Frequência

```bash
curl -X POST http://localhost:3000/api/frequencias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "opsId": "OPS001",
    "dataReferencia": "2024-01-15",
    "idTipoAusencia": 1,
    "horaEntrada": "08:00:00",
    "horaSaida": "17:00:00",
    "horasTrabalhadas": 8.0
  }'
```

---

## 🔒 Segurança

- ✅ Senhas com hash usando bcryptjs
- ✅ JWT para autenticação stateless
- ✅ Helmet para headers de segurança HTTP
- ✅ CORS configurável
- ✅ Validação de dados em todas as entradas
- ✅ Tratamento de erros sem expor detalhes sensíveis
- ✅ Controle de acesso baseado em roles

---

## 🐛 Troubleshooting

### Erro de conexão com o banco

- Verifique se o PostgreSQL está rodando
- Confira a `DATABASE_URL` no arquivo `.env`
- Teste a conexão: `psql -U usuario -d gestao_colaboradores`

### Erro "JWT_SECRET not defined"

- Certifique-se de ter configurado o `.env` corretamente
- A variável `JWT_SECRET` é obrigatória

### Porta 3000 já em uso

- Altere a porta no arquivo `.env`: `PORT=3001`

---

## 📚 Recursos Adicionais

- [Documentação do Prisma](https://www.prisma.io/docs)
- [Documentação do Express](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 👨‍💻 Autor

Sistema desenvolvido para gestão completa de colaboradores, frequências e ausências.

---

## 📄 Licença

ISC

---

**🎉 Pronto! Seu backend está configurado e funcionando!**

Para qualquer dúvida, consulte a documentação ou verifique os logs do servidor.
