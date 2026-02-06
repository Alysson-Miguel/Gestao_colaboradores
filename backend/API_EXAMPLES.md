# 📡 Exemplos de Uso da API - Exportação Google Sheets

## 🔗 Endpoint de Exportação

### GET /api/ponto/exportar-sheets

Exporta o controle de presença para Google Sheets com filtros opcionais.

## 📋 Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição                    | Exemplo      |
|-----------|--------|-------------|------------------------------|--------------|
| mes       | string | Sim         | Mês no formato YYYY-MM       | 2026-02      |
| turno     | string | Não         | Filtrar por turno            | T1, T2, T3   |
| escala    | string | Não         | Filtrar por escala           | A, B, C      |
| lider     | string | Não         | Filtrar por líder (opsId)    | OPS001       |

## 📤 Exemplos de Requisição

### 1. Exportar Mês Completo

```bash
curl -X GET "http://localhost:3000/api/ponto/exportar-sheets?mes=2026-02" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 2. Exportar Turno Específico

```bash
curl -X GET "http://localhost:3000/api/ponto/exportar-sheets?mes=2026-02&turno=T1" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 3. Exportar Escala Específica

```bash
curl -X GET "http://localhost:3000/api/ponto/exportar-sheets?mes=2026-02&escala=A" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 4. Exportar com Múltiplos Filtros

```bash
curl -X GET "http://localhost:3000/api/ponto/exportar-sheets?mes=2026-02&turno=T2&escala=B" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 5. Exportar por Líder

```bash
curl -X GET "http://localhost:3000/api/ponto/exportar-sheets?mes=2026-02&lider=OPS001" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## 📥 Resposta de Sucesso

### Status: 200 OK

```json
{
  "success": true,
  "message": "Exportação realizada com sucesso",
  "data": {
    "mes": "2026-02",
    "colaboradores": 45,
    "celulasAtualizadas": 1350,
    "linhas": 46,
    "colunas": 32,
    "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1lgrpflaIybMq7Z-8tZ7A6cueepYZ0yNBTSyDYvNaWNk"
  }
}
```

### Campos da Resposta

| Campo              | Tipo   | Descrição                                    |
|--------------------|--------|----------------------------------------------|
| success            | boolean| Indica se a operação foi bem-sucedida        |
| message            | string | Mensagem descritiva                          |
| data.mes           | string | Mês exportado                                |
| data.colaboradores | number | Quantidade de colaboradores exportados       |
| data.celulasAtualizadas | number | Total de células atualizadas na planilha |
| data.linhas        | number | Número de linhas (incluindo cabeçalho)      |
| data.colunas       | number | Número de colunas                            |
| data.spreadsheetUrl| string | URL da planilha no Google Sheets            |

## ❌ Respostas de Erro

### 400 - Bad Request (Parâmetro Inválido)

```json
{
  "success": false,
  "message": "Parâmetro 'mes' é obrigatório (YYYY-MM)",
  "error": null
}
```

### 404 - Not Found (Nenhum Colaborador)

```json
{
  "success": false,
  "message": "Nenhum colaborador encontrado para os filtros selecionados",
  "error": null
}
```

### 500 - Internal Server Error

```json
{
  "success": false,
  "message": "Erro ao exportar para Google Sheets",
  "error": "Permission denied"
}
```

## 🔐 Autenticação

A API requer autenticação JWT. Inclua o token no header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Exemplos com JavaScript/Axios

### Frontend React

```javascript
import api from './services/api';

// Exportar mês atual
const exportarPresenca = async () => {
  try {
    const mes = '2026-02';
    const response = await api.get('/ponto/exportar-sheets', {
      params: { mes }
    });

    if (response.data.success) {
      const { data } = response.data;
      alert(`Exportação concluída!\n${data.colaboradores} colaboradores exportados`);
      window.open(data.spreadsheetUrl, '_blank');
    }
  } catch (error) {
    console.error('Erro ao exportar:', error);
    alert('Erro ao exportar dados');
  }
};

// Exportar com filtros
const exportarComFiltros = async (mes, turno, escala) => {
  try {
    const params = {
      mes,
      ...(turno !== 'TODOS' ? { turno } : {}),
      ...(escala !== 'TODOS' ? { escala } : {}),
    };

    const response = await api.get('/ponto/exportar-sheets', { params });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

### Node.js

```javascript
const axios = require('axios');

const exportarPresenca = async (token, mes, filtros = {}) => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/ponto/exportar-sheets',
      {
        params: { mes, ...filtros },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Exportação concluída:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
    throw error;
  }
};

// Uso
exportarPresenca('SEU_TOKEN', '2026-02', { turno: 'T1' });
```

## 🔄 Sincronização Automática

A sincronização automática não requer chamada de API. Ela roda automaticamente no servidor.

### Configuração

```env
# Habilitar/desabilitar
SYNC_ENABLED=true

# Intervalo em minutos
SYNC_INTERVAL_MINUTES=5
```

### Logs

```
⏰ [2026-02-06T10:00:00.000Z] Executando sincronização de presença...
✅ Sincronização concluída com sucesso
📊 45 colaboradores | 1350 células atualizadas
```

## 🧪 Testando com Postman

### 1. Criar Nova Requisição
- Método: `GET`
- URL: `http://localhost:3000/api/ponto/exportar-sheets`

### 2. Adicionar Parâmetros (Query Params)
```
mes: 2026-02
turno: T1
```

### 3. Adicionar Header
```
Authorization: Bearer SEU_TOKEN_JWT
```

### 4. Enviar Requisição

### 5. Verificar Resposta
- Status: 200 OK
- Body: JSON com dados da exportação

## 📝 Notas Importantes

1. **Permissões**: A conta de serviço deve ter permissão de Editor na planilha
2. **Aba**: A aba `Controle_Presenca` deve existir na planilha
3. **Sobrescrita**: Os dados são sempre sobrescritos (não acumulam)
4. **Performance**: Exportação de 50 colaboradores leva ~3-5 segundos
5. **Rate Limit**: Google Sheets API tem limite de 100 requisições/100 segundos

## 🔗 Endpoints Relacionados

### GET /api/ponto/controle
Busca dados de presença (usado internamente pela exportação)

```bash
curl "http://localhost:3000/api/ponto/controle?mes=2026-02" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### POST /api/ponto/ajuste-manual
Ajusta presença manualmente (reflete na próxima exportação)

```bash
curl -X POST "http://localhost:3000/api/ponto/ajuste-manual" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "opsId": "OPS001",
    "dataReferencia": "2026-02-06",
    "status": "P",
    "justificativa": "ESQUECIMENTO_MARCACAO",
    "horaEntrada": "08:00",
    "horaSaida": "17:00"
  }'
```

## 🎯 Casos de Uso

### 1. Exportação Diária Automática
Configure `SYNC_INTERVAL_MINUTES=1440` (24 horas)

### 2. Exportação por Demanda
Use o endpoint manual quando necessário

### 3. Relatórios Personalizados
Use filtros para gerar relatórios específicos

### 4. Integração com Outros Sistemas
Chame a API de outros sistemas para sincronizar dados

---

**Documentação da API:** Completa  
**Exemplos:** Testados e funcionais  
**Suporte:** Disponível via logs e troubleshooting
