# Mapeamento Exato de Gaps - Absenteismo, DSR e Ajustes

## Objetivo

Este documento mapeia exatamente os gaps de logica encontrados no projeto em relacao a:

- formula padrao de absenteismo
- regra de HC apto
- tratamento de DSR
- efeitos de ajuste manual, atestado e ausencia administrativa

Tambem lista, por arquivo, o que precisa mudar.

## Regra alvo

Regra de referencia definida:

```text
Absenteismo = Ausencias (F, FJ, AM) / HC Apto (F, FJ, AM, FO, BH, P, S1)
```

Interpretacao pratica:

- entram no numerador: `F`, `FJ`, `AM`
- entram no denominador: `F`, `FJ`, `AM`, `FO`, `BH`, `P`, `S1`
- ficam fora do HC apto: `DSR`, `NC`, `ON`, `FE`, `AFA`, `AF`, `LM`, `LP`, `T`

---

## 1. Estado atual consolidado

### 1.1 Arquivos principais envolvidos

- `backend/src/controllers/dashboard.controller.js`
- `backend/src/controllers/dashboardAdmin.controller.js`
- `backend/src/controllers/dashboardColaboradores.controller.js`
- `backend/src/controllers/absenteismo.controller.js`
- `backend/src/controllers/ponto.controller.js`
- `backend/src/controllers/atestado.controller.js`
- `backend/src/services/dsrBackfill.service.js`
- `backend/src/services/detectarFaltasAutomatico.service.js`
- `backend/src/services/folgaDominical.service.js`
- `backend/src/jobs/gerarDSRFuturo.job.js`

### 1.2 Situacao geral

- O `dashboard.controller.js` esta mais proximo da regra alvo.
- O `dashboardAdmin.controller.js` e o `dashboardColaboradores.controller.js` ainda nao estao 100% alinhados.
- O `absenteismo.controller.js` continua com logica propria de eventos e impacto, nao com a formula classica.
- A regra de DSR nao esta centralizada: existem mapas e interpretacoes diferentes em modulos distintos.

---

## 2. Gaps exatos de absenteismo

## Gap A - `BH` nao esta padronizado em todos os dashboards

### Situacao atual

#### `dashboard.controller.js`

Ja trata `BH` corretamente:

- `BH` entra no HC apto
- `BH` nao impacta absenteismo

Referencia:

- [backend/src/controllers/dashboard.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/dashboard.controller.js)

#### `dashboardAdmin.controller.js`

Nao trata `BH` explicitamente na funcao `getStatusDoDia`.

Comportamento atual:

- `FO` tratado como HC apto
- `S1` tratado como HC apto
- `BH` nao aparece como caso explicito
- qualquer codigo nao tratado cai no bloco final de ausencia impactante

Impacto:

- `BH` pode entrar no numerador indevidamente
- `BH` pode inflar absenteismo

Referencia:

- [backend/src/controllers/dashboardAdmin.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/dashboardAdmin.controller.js)

#### `dashboardColaboradores.controller.js`

Tambem nao trata `BH` explicitamente.

Comportamento atual:

- `FO` tratado como HC apto
- `S1` tratado como HC apto
- `BH` nao aparece
- qualquer outra ausencia vira `Falta`

Impacto:

- `BH` pode entrar como ausencia e impactar o numerador

Referencia:

- [backend/src/controllers/dashboardColaboradores.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/dashboardColaboradores.controller.js)

### O que precisa mudar

Padronizar `BH` nestes dois arquivos:

- `contaComoEscalado: true`
- `impactaAbsenteismo: false`

Arquivos:

- `backend/src/controllers/dashboardAdmin.controller.js`
- `backend/src/controllers/dashboardColaboradores.controller.js`

---

## Gap B - `absenteismo.controller.js` nao usa a formula classica

### Situacao atual

O dashboard dedicado de absenteismo:

- busca faltas pela `Frequencia`
- busca atestados em `AtestadoMedico`
- soma eventos
- soma dias afastados
- calcula recorrencia
- calcula percentual de HC impactado

Ele nao calcula:

```text
Ausencias (F, FJ, AM) / HC Apto (F, FJ, AM, FO, BH, P, S1)
```

Detalhes atuais:

- `buildWhereFrequencia` filtra so `idTipoAusencia in [3, 32]`
- `buildWhereAtestado` busca `AtestadoMedico`
- `resumo` devolve `totalPeriodo`, `totalFaltas`, `totalAtestados`, `diasAfastados`, `recorrencia`, `percentualHC`

Impacto:

- essa tela nao representa a mesma metrica de absenteismo dos dashboards operacionais
- ela representa consolidado de ausencia e impacto

Referencia:

- [backend/src/controllers/absenteismo.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/absenteismo.controller.js)

### O que precisa mudar

Decisao de negocio necessaria:

#### Opcao 1 - manter como dashboard analitico de ausencia

Se a intencao for manter essa tela como painel de eventos:

- manter a logica atual
- renomear claramente os KPIs
- nao chamar essa tela de "taxa de absenteismo"

#### Opcao 2 - alinhar com a formula padrao

Se a intencao for transformá-la em dashboard de taxa:

- substituir a base atual por classificacao via `contaComoEscalado` e `impactaAbsenteismo`
- usar `Frequencia` como fonte principal do periodo
- calcular:

```text
totalHcAptoDias
totalAusenciasDias
absenteismo = totalAusenciasDias / totalHcAptoDias * 100
```

- separar KPIs secundarios:
  - eventos
  - dias perdidos
  - recorrencia
  - HC impactado

Arquivo:

- `backend/src/controllers/absenteismo.controller.js`

---

## Gap C - regra de universo elegivel continua divergente

### Situacao atual

#### `absenteismo.controller.js`

Inclui:

- `Auxiliar de Logistica I`
- `Auxiliar de Logistica II`
- `Auxiliar de Logistica I - PCD`

#### `dashboardAdmin.controller.js`

Exclui `PCD` pela funcao `isCargoElegivel`.

#### `dashboardColaboradores.controller.js`

Exclui `PCD` e ainda restringe a BPO.

#### `dashboard.controller.js`

Tambem exclui `PCD`.

Impacto:

- os dashboards podem usar a mesma formula e ainda assim devolver numeros diferentes
- a divergencia nao e de conta; e de populacao

### O que precisa mudar

Definir oficialmente se `PCD` entra ou nao no universo de absenteismo.

Depois aplicar a mesma regra, de forma explicita, em:

- `backend/src/controllers/dashboard.controller.js`
- `backend/src/controllers/dashboardAdmin.controller.js`
- `backend/src/controllers/dashboardColaboradores.controller.js`
- `backend/src/controllers/absenteismo.controller.js`

Observacao:

Se houver dashboards com intencao diferente por publico, isso precisa ficar documentado no proprio endpoint e no frontend.

---

## 3. Gaps exatos de DSR

## Gap D - mapeamento de DSR nao esta centralizado

### Situacao atual

Existem mapas diferentes de DSR em lugares diferentes.

#### `ponto.controller.js`

Usa:

- `E: [0, 1]`
- `G: [2, 3]`
- `C: [4, 5]`

Referencia:

- [backend/src/controllers/ponto.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/ponto.controller.js)

#### `dsrBackfill.service.js`

Usa banco `diasDsr`, mas com fallback legado:

- `E: [0, 1]`
- `G: [2, 3]`
- `C: [4, 5]`

Referencia:

- [backend/src/services/dsrBackfill.service.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/services/dsrBackfill.service.js)

#### `dashboardColaboradores.controller.js`

Usa:

- `A: [0, 3]`
- `B: [1, 2]`
- `C: [4, 5]`

Referencia:

- [backend/src/controllers/dashboardColaboradores.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/dashboardColaboradores.controller.js)

#### `detectarFaltasAutomatico.service.js`

Usa mistura:

- `E`
- `G`
- `C`
- `A`
- `B`

Referencia:

- [backend/src/services/detectarFaltasAutomatico.service.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/services/detectarFaltasAutomatico.service.js)

#### `folgaDominical.service.js`

Considera elegiveis:

- `B`
- `C`
- `G`

Referencia:

- [backend/src/services/folgaDominical.service.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/services/folgaDominical.service.js)

### Impacto

Esse e o gap mais grave do modulo.

Consequencias:

- um mesmo colaborador pode ser DSR em uma tela e nao ser em outra
- o backfill pode gerar dias que o ponto nao reconhece
- o ponto pode bloquear um dia que outro dashboard considera dia util
- a deteccao automatica de faltas pode ignorar dias diferentes do painel
- o atestado pode preservar ou nao preservar DSR de forma inconsistente

### O que precisa mudar

Criar uma unica origem de verdade para DSR.

Recomendacao:

1. criar util compartilhado, por exemplo:

- `backend/src/utils/dsr.js`

2. esse util deve:

- ler `diasDsr` da escala
- ter um fallback unico e documentado apenas enquanto houver escalas antigas
- expor algo como:
  - `getDiasDsr(nomeEscala, tx?)`
  - `isDiaDSR(data, nomeEscala, tx?)`

3. substituir a logica local duplicada em:

- `backend/src/controllers/ponto.controller.js`
- `backend/src/controllers/atestado.controller.js`
- `backend/src/controllers/dashboardColaboradores.controller.js`
- `backend/src/services/detectarFaltasAutomatico.service.js`
- `backend/src/services/dsrBackfill.service.js`

4. remover mapas hardcoded conflitantes depois da centralizacao

---

## Gap E - `folgaDominical.service.js` nao faz backfill historico como o documento sugere

### Situacao atual

Ao gerar folga dominical, o codigo chama:

- `gerarDSRBackfillColaborador({ opsId, nomeEscala })`
- `gerarDSRFuturoColaborador({ opsId, nomeEscala, dias: 120 })`

O problema:

- `gerarDSRBackfillColaborador` sem `dataInicio` usa `hoje` como inicio
- portanto ele nao varre passado historico
- ele cobre apenas do dia atual ate o proprio dia atual

Referencias:

- [backend/src/services/folgaDominical.service.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/services/folgaDominical.service.js)
- [backend/src/services/dsrBackfill.service.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/services/dsrBackfill.service.js)

### Impacto

- o documento de ajuste diz que a projecao cria "DSRs passados faltantes"
- o codigo atual nao faz isso

### O que precisa mudar

Se a intencao for realmente fazer backfill passado ao gerar a projecao:

- passar `dataInicio` explicito

Opcoes validas:

- `dataAdmissao` do colaborador
- inicio do mes da projecao
- um marco operacional definido pelo negocio

Arquivo:

- `backend/src/services/folgaDominical.service.js`

---

## Gap F - DSR em atestado tambem usa mapa local

### Situacao atual

Ao criar atestado, o sistema tenta preservar DSR:

- nao sobrepoe se o banco ja tem DSR
- nao sobrepoe se a escala disser que o dia e DSR

Mas a funcao `isDiaDSR` em `atestado.controller.js` usa mapa local proprio.

Referencia:

- [backend/src/controllers/atestado.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/atestado.controller.js)

### Impacto

- atestado pode preservar ou sobrescrever dias de forma diferente de outros modulos

### O que precisa mudar

Substituir `isDiaDSR` local por util compartilhado central.

Arquivo:

- `backend/src/controllers/atestado.controller.js`

---

## 4. Gaps ligados a ajuste manual e materializacao da falta

## Gap G - sem registro nao significa a mesma coisa em todo lugar

### Situacao atual

Existem dois comportamentos diferentes no sistema:

#### Em alguns pontos

"sem registro" e tratado como falta logica.

Exemplo:

- controle mensal mostra `-`
- alguns classificadores tratam ausencia sem registro como `Falta`

#### Em outros pontos

os dashboards iteram apenas sobre `Frequencia` existente.

Exemplo:

- `dashboard.controller.js` calcula o periodo em cima de `frequenciasPeriodo`
- se nao houver linha materializada, o dia nao entra no loop

### Impacto

- a falta visual e a falta estatistica podem divergir
- o backfill de DSR corrige parte disso, mas nao resolve o problema estrutural

### O que precisa mudar

Definir regra oficial:

#### Modelo 1 - ausencia depende de linha materializada

Se esse for o modelo oficial:

- garantir materializacao automatica das faltas
- garantir materializacao consistente de DSR, ON, AM e outras ausencias

#### Modelo 2 - ausencia pode ser inferida da ausencia de registro

Se esse for o modelo oficial:

- os dashboards de periodo precisam passar a considerar calendario esperado e nao apenas linhas de `Frequencia`

Recomendacao:

- manter modelo 1
- garantir pipeline consistente de materializacao

Arquivos mais afetados:

- `backend/src/controllers/dashboard.controller.js`
- `backend/src/controllers/dashboardAdmin.controller.js`
- `backend/src/controllers/dashboardColaboradores.controller.js`
- `backend/src/controllers/ponto.controller.js`
- `backend/src/services/detectarFaltasAutomatico.service.js`

---

## 5. Checklist exato do que precisa mudar

## Prioridade 1 - obrigatorio

1. Criar util unico de DSR em `backend/src/utils/dsr.js`.
2. Substituir mapas locais de DSR nos controladores e services.
3. Padronizar `BH` em `dashboardAdmin.controller.js`.
4. Padronizar `BH` em `dashboardColaboradores.controller.js`.
5. Decidir oficialmente se `absenteismo.controller.js` continua analitico ou vira taxa padrao.

## Prioridade 2 - fortemente recomendado

6. Ajustar `folgaDominical.service.js` para backfill historico real, se esse for o objetivo funcional.
7. Definir regra unica de universo elegivel para `PCD`.
8. Documentar, por endpoint, se a metrica e:

- taxa de absenteismo
- eventos de ausencia
- dias perdidos
- HC impactado

## Prioridade 3 - organizacao tecnica

9. Remover comentarios antigos que ainda falam que `FO` fica fora do HC em trechos ja ajustados.
10. Consolidar um unico helper de classificacao do status do dia, ou ao menos uma funcao base compartilhada para:

- `contaComoEscalado`
- `impactaAbsenteismo`
- `label`
- `code`

---

## 6. Resultado esperado apos os ajustes

Com os ajustes acima, o sistema passa a ter:

- uma regra unica de DSR
- uma regra unica de classificacao de status do dia
- absenteismo realmente alinhado a:

```text
Ausencias (F, FJ, AM) / HC Apto (F, FJ, AM, FO, BH, P, S1)
```

- dashboards diferentes por publico, mas sem contradicao logica de base

---

## 7. Resumo final

Hoje os gaps reais sao:

- `BH` ainda nao padronizado em todos os dashboards
- `absenteismo.controller.js` ainda fora da formula padrao
- mapeamento de DSR fragmentado e conflitante
- `folgaDominical.service.js` sem backfill historico real
- ausencia sem registro ainda nao padronizada como conceito estatistico

O maior risco atual e o DSR.

Enquanto DSR estiver com mapas diferentes entre modulos, o sistema pode continuar apresentando divergencia entre:

- ponto
- absenteismo
- backfill
- atestado
- deteccao automatica de faltas
