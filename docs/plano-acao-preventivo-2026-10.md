# Plano de ação preventivo e registro de ajustes — Colaboradores, Frequência e Cadastro

**Data:** 04/10/2026
**Escopo:** estações Jaboatão (1) e Recife (6).
**Origem:** revisão de qualidade de dados e correções feitas em 03–04/10/2026.

> Legenda de status: ✅ concluído e verificado no banco · 🟢 código corrigido (commitado) · 🟡 pendente (depende de decisão ou de dado) · 🔴 não tratado

---

## 1. Resumo executivo

A maioria dos problemas encontrados tinha a mesma raiz: **dados inconsistentes na entrada(cadastro)** (cadastro, importação, troca de escala). Corrigi os dados afetados e fechei as portas de entrada mais críticas.

| Tema | Dados corrigidos | Código corrigido | Pendente |
|---|---|---|---|
| Folga dominical perdida em troca de escala | ✅ 8 colaboradores (ajuste manual) | 🟢 3 pontos do código |
| Horário de início da jornada | ✅ 566 colaboradores | 🟢 cadastro e importação | Edição de colaborador sem a regra |
| Líder INATIVO | ✅ 53 de 53 | 🟢 validação de líder ativo |
| OPS ID fora do padrão | ✅ 8 corrigidos | 🟢 formato obrigatório |
| Cadastro e importação | — | 🟢 validações e importação reescrita |

---

## 2. Registro dos ajustes realizados

### 2.1 Dados corrigidos no banco


#### B. Horário de início da jornada fora do turno
- **Problema:** os horários errados eram o início do turno **cadastro errado**, com origem em um padrão gravado sem UTC na importação. Além disso, havia colaboradores com horário que parecia válido, mas era de outro turno (263 do T3 com 05:25, por exemplo).
- **Ajuste:** `horario_inicio_jornada` igualado ao padrão do turno (ADM 08:00, T1 05:25, T2 13:20, T3 21:00), para ATIVOS das estações 1 e 6, cargos 9 e 10.
  - 111 fora do conjunto 05:25/13:20/21:00.
  - 455 dentro do conjunto mas incompatíveis com o turno.
- **Verificação:** ✅ 0 divergentes.

#### C. Líder INATIVO em 54 colaboradores
- **Problema:** colaboradores ATIVOS vinculados a líderes INATIVOS.
- **Ajuste:** troca para líder ATIVO de mesmo setor e turno, com registro em `historico_movimentacao`.

| Setor / turno | Qtde | Novo líder |
|---|---|---|
| Esteira A T1 | 27 | Roseline Vitor da Silva |
| Recebimento T3 | 14 | Mateus Ribeiro da Silva (lider Recebimento PE2) |
| Esteira B T3 | 3 | Wesley Carlos Cassiano Freire |
| Esteira Termoplástica T3 | 3 | Everton da Silva Brito |
| Esteira A T3 | 3 | Charles Diego Marques dos Santos |
| Expedição T3 | 2 | Alex de Souza Lima |
| Esteira A T2 | 1 | Jessica de Souza Ferreira |

- **Verificação:** ✅ 53 de 53 com líder ATIVO.

#### D. OPS ID fora do padrão `Ops` + números
- **Problema:** 32 ATIVOS com OPS ID inválido (provisórios, em minúsculas, sem o prefixo ou com nome no lugar do ID). O OPS ID é chave primária e é como Frequência, produção e planilhas encontram o colaborador.
- **Ajuste:** troca da chave primária propagada por todas as tabelas dependentes, em uma única transação (as chaves estrangeiras eram `ON UPDATE NO ACTION`, então um `UPDATE` direto falhava).
  - 3 de Jaboatão e Recife, ops_id corrigidos: `357708` → `Ops357708`, `06098807485` → `Ops589137`, `OPS546071` → `Ops546071`. Propagou para 313 linhas de Frequência, 12 liderados, treinamentos, solicitações, histórico de escala e de movimentação.
- **Verificação:** ✅ 0 Ops_ids antigos, 0 referências antigas, 19 chaves estrangeiras restauradas em `NO ACTION`.

#### E. Folga dominical — colaboradores sem folga em outubro
- **Problema:** 8 colaboradores aptos (T2, escalas C e G, Jaboatão) ficaram sem folga dominical em outubro.
- **Causa (confirmada nos dados):**
  - 3 estavam na escala G na geração (25/09) e tiveram troca de escala em 28/09; a troca de escala apagou a folga dominical.
  - 1 teve troca de escala em 01/10, com o mesmo efeito.
  - 2 não eram elegíveis na hora da geração (escala ADM e escala E) e mudaram depois dela.
  - 2 tinham lançamento manual de Justiça Eleitoral nos domingos que substituiu a folga DSR.
- **Ajuste:** corrigido manualmente hoje 03/10 (lançamentos `DSR`/`ALTERACAO_PONTO`). código foi corrigido para evitar os problemas.

### 2.2 Correções de código (commitadas)

| Commit | Mudança |
|---|---|
| `95b60ec` | **Troca de escala preserva a folga dominical** quando a nova escala é B, C ou G. Antes, o `deleteMany` apagava todo DSR futuro não manual, inclusive `DSR_FOLGA_DOMINICAL_AUTOMATICA`. Corrigido nos 3 pontos: aprovação de troca de escala, edição de colaborador e importação. Helper `preservarFolgaDominicalWhere` em `utils/dsr.js`. |
| `f6cd615` | **Horário de início definido pelo turno** (ADM 08:00, T1 05:25, T2 13:20, T3 21:00), no cadastro e na importação. Horário ausente assume o padrão (nunca `null`); horário errado é recusado; turno passa a ser obrigatório. Corrige o padrão da importação, que era gravado sem UTC. |
| `bccd2b7` | **Validações de cadastro:** a importação não reativa colaborador INATIVO nem muda a estação; estação vem do contexto; líder, setor, cargo, empresa, turno e escala precisam existir, pertencer à estação (ou a uma estação irmã) e o líder deve estar ATIVO; CPF validado por dígito verificador e gravado só com dígitos; mesmos campos obrigatórios nos dois fluxos. |
| `0aa6a9e` | **Importação reescrita** em serviço próprio: modo "Apenas validar" (sem gravar), uma transação por linha, pré-carga em lote, resultado por usuário com progresso, NC pré-admissão, detecção de OPS ID, CPF e matrícula repetidos ou já usados, validação de e-mail, telefone e admissão futura (acima de 7 dias). Cadastro individual passa a nascer sempre ATIVO. |
| `7be85cc` | **OPS ID no formato `Ops` + números** (caixa normalizada) no cadastro e na importação, mais o script de renomeação com troca de chave primária segura. |

---

## 3. Plano de ação preventivo

Prioridade: **P1** = Prioridade · **P2** = reduz risco e retrabalho · **P3** = melhoria.

### 3.1 Dados e integridade

| # | Prioridade | Ação | Por quê | Critério de pronto |
|---|---|---|---|---|
| 1 | **P1** | **Auditoria de mudança de status do colaborador** (quem, de qual para qual, quando), cobrindo reativação, inativação e edição | O caso do Ops412117 mostrou que não há como saber quem reativou e inativou de novo; a reativação só limpa campos de desligamento sem log | Tabela de auditoria preenchida em todo o fluxo de status; consulta por OPS ID retorna a linha do tempo | 🟢 feito |
| 2 | **P1** | **Histórico na aplicação de Sinergia/Folga/BH** na Frequência (`aplicarNaFrequencia`) | O `upsert` sobrescreve o status e **zera as batidas** sem gravar `FrequenciaHistorico`, o que impediu recuperar o status anterior de 36 colaboradores | Cada aplicação grava status anterior e novo, e preserva as batidas originais | 🟢 feito |
| 3 | **P1** | **Correção de data da solicitação** como operação do sistema (mover data com reaplicação correta na Frequência) | Hoje exige script manual e dá para errar a restauração | Tela ou endpoint de ajuste de data com histórico | apenas para ADMIN | 🟢 feito |
| 4 | **P2** | **Geração incremental da folga dominical** (preenche só quem está elegível e sem folga no mês) | A geração roda uma vez por mês e só vale para quem é elegível naquele instante; quem muda de escala depois fica descoberto | Rodar a geração no meio do mês não duplica nem apaga e cobre os novos elegíveis | 🟢 feito |
| 5 | **P2** | **Lançamento manual (ex.: Justiça Eleitoral) não pode apagar folga dominical em silêncio** | Hipótese forte em 2 dos 8 casos; o `upsert` não deixa rastro | Aviso na tela quando o dia já tem folga dominical, e histórico gravado | 🟢 feito |
| 6 | **P2** | **Aplicar a regra de horário por turno na edição de colaborador** (`updateColaborador`) e ao trocar o turno | O erro pode voltar por edição ou por mudança de turno | Editar turno atualiza o horário; horário divergente é recusado | 🟢 feito |
| 7 | **P2** | **Bloquear inativação de líder que ainda tem liderados ativos** (ou exigir indicar o substituto) | Origem dos 54 casos de líder INATIVO | Inativar líder com liderados ativos pede substituição | 🟢 feito |

### 3.2 Cadastro e importação

| # | Prioridade | Ação | Status |
|---|---|---|---|
| 10 | **P1** | Validações de entrada (estação, vínculos, CPF, obrigatórios, OPS ID, horário) | 🟢 feito |
| 13 | **P2** | **Usar sempre "Apenas validar" antes de importar** em lotes grandes | 🟢 recurso disponível |
| 14 | **P3** | Cadastrar e-mail e telefone (1.561 ativos sem e-mail, 1.278 sem telefone) (numero de todas as estações) | 🔴 não tratado |
| 15 | **P3** | Normalizar CPFs antigos com pontuação (12 registros) e outros formatos (15) | 🔴 não tratado |

### 3.3 Interface

| # | Prioridade | Ação |
|---|---|---|
| 16 | **P2** | **Treinamento "some" na estação 6:** o front permite líder de outra estação, mas o backend filtra pela estação do líder. 9 treinamentos ficaram invisíveis (7 em Recife, 2 em Jaboatão). Correção proposta: considerar a estação do líder **ou** dos participantes na listagem, nos totais e no acesso. Aguardando aprovação | 🟢 feito |

--