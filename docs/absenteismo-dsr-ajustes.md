# Ajustes de Absenteísmo e DSR

**Data:** 16/04/2026

---

## 1. Correção da lógica de HC Apto (`dashboard.controller.js`)

Ajuste nas regras de `contaComoEscalado` e `impactaAbsenteismo` para seguir a fórmula:

```
Absenteísmo = Ausências (F, FJ, AM) / HC Apto (F, FJ, AM, FO, BH, P, S1)
```

### Mudanças

- **`FO` (Folga):** passou a contar no denominador (`contaComoEscalado: true`). Antes estava fora do HC Apto.
- **`FJ` (Falta Justificada):** adicionado como ausência (`contaComoEscalado: true, impactaAbsenteismo: true`). Antes não existia no mapeamento.
- **`DSR`:** mantido fora do HC Apto (`contaComoEscalado: false`), separado do bloco de `FO`.

---

## 2. Inclusão do cargo "Auxiliar de Logística I - PCD" no cálculo de absenteísmo (`absenteismo.controller.js`)

O cargo `"Auxiliar de Logística I - PCD"` foi adicionado ao array `CARGOS_ABSENTEISMO`, que é aplicado em todos os 4 endpoints do dashboard de absenteísmo:

```js
const CARGOS_ABSENTEISMO = [
  "Auxiliar de Logística I",
  "Auxiliar de Logística II",
  "Auxiliar de Logística I - PCD",
];
```

---

## 3. Correção de DSR faltantes no banco de dados

### Problema identificado

Verificação revelou que **1.506 registros de DSR** estavam faltando no banco para março/abril de 2026. Esses dias estavam sendo tratados como "sem lançamento" e contados como falta, inflando o absenteísmo.

### Causa

O `gerarDSRFuturoColaborador` só era chamado ao criar ou alterar a escala de um colaborador. Colaboradores antigos não tinham cobertura contínua de DSR futuro.

### Correção

Backfill executado manualmente via script direto:
- **930 colaboradores** processados
- **31.880 registros** de DSR criados
- **0 erros**

---

## 4. Job automático semanal de DSR (`gerarDSRFuturo.job.js`)

Criado job com `node-cron` que roda **toda segunda-feira às 03:00 (horário de Brasília)**.

**Arquivo:** `backend/src/jobs/gerarDSRFuturo.job.js`

### Comportamento

- Busca todos os colaboradores com status `ATIVO`, `FERIAS` ou `AFASTADO`
- Chama `gerarDSRFuturoColaborador` para cada um, gerando os próximos **90 dias** de DSR
- `skipDuplicates: true` garante que registros existentes não são duplicados
- Registrado no `server.js` junto aos demais jobs

---

## 5. DSR gerado automaticamente ao criar Projeção de Folgas Dominicais (`folgaDominical.service.js`)

Ao gerar a projeção de folgas dominicais para um mês, o sistema agora também executa:

1. `gerarDSRBackfillColaborador` — cria DSRs passados faltantes para os elegíveis (escalas B, C, G)
2. `gerarDSRFuturoColaborador` — garante os próximos **120 dias** de DSR semanal para os elegíveis

Isso garante que as escalas B, C e G (únicas elegíveis para folga dominical) sempre terão seus DSRs semanais registrados no banco quando a projeção for gerada.

---

## 6. Endpoint de backfill manual de DSR

Adicionado endpoint para acionar o backfill manualmente quando necessário:

```
POST /api/colaboradores/backfill-dsr
```

- Restrito a usuários com role `ADMIN`
- Processa todos os colaboradores ativos/férias/afastados
- Retorna quantidade de registros criados e eventuais erros

---

## 7. Outras correções

### Nome completo na projeção de folgas (`folgaDominical.jsx`)

Removido o `.split(" ").slice(0, 3).join(" ")` que cortava o nome em 3 palavras. Agora exibe o nome completo do colaborador.

### Correção de atestados no gráfico "Por Dia da Semana" (`absenteismo.controller.js`)

Adicionada a linha faltante no loop de atestados do `getDistribuicoesAbsenteismo`:

```js
inc(acc.diaSemana, DIAS_SEMANA[new Date(a.dataInicio).getDay()], "atestados");
```
