# 📑 Abas Automáticas por Mês

## 🎯 Nova Funcionalidade

O sistema agora cria **automaticamente uma aba diferente para cada mês**, preservando o histórico completo de presença.

## 📊 Como Funciona

### Nomenclatura Automática

As abas são criadas automaticamente com o formato:
```
Presenca_YYYY_MM
```

**Exemplos:**
- Janeiro 2026 → `Presenca_2026_01`
- Fevereiro 2026 → `Presenca_2026_02`
- Março 2026 → `Presenca_2026_03`
- Dezembro 2026 → `Presenca_2026_12`

### Criação Automática

1. **Primeira exportação do mês:**
   - Sistema verifica se a aba existe
   - Se não existir, cria automaticamente
   - Exporta os dados

2. **Exportações seguintes:**
   - Sistema usa a aba já existente
   - Sobrescreve os dados (sempre atualizado)

## 📁 Estrutura da Planilha

### Antes (Aba Única)
```
Planilha: Controle de Presença
└── Controle_Presenca  ← Sempre sobrescrito
```
**Problema:** Perdia histórico ao mudar de mês

### Depois (Abas por Mês) ✨
```
Planilha: Controle de Presença
├── Presenca_2026_01  ← Janeiro (histórico preservado)
├── Presenca_2026_02  ← Fevereiro (histórico preservado)
├── Presenca_2026_03  ← Março (atual, sempre atualizado)
├── Dashboard         ← Seus gráficos
└── Análises          ← Suas análises
```
**Vantagem:** Histórico completo preservado!

## 🔄 Sincronização Automática

### Comportamento

**Mês Atual:**
- Sincronização automática a cada 5 minutos
- Sempre atualiza a aba do mês atual
- Exemplo: Em março, atualiza `Presenca_2026_03`

**Meses Anteriores:**
- Não são mais atualizados
- Ficam como histórico
- Exemplo: `Presenca_2026_01` e `Presenca_2026_02` ficam intactos

### Mudança de Mês

Quando o mês muda (ex: de fevereiro para março):

1. **Automaticamente:**
   - Sistema detecta novo mês
   - Cria nova aba `Presenca_2026_03`
   - Começa a sincronizar na nova aba

2. **Aba anterior:**
   - `Presenca_2026_02` fica preservada
   - Não é mais atualizada
   - Serve como histórico

## 📤 Exportação Manual

### Com Filtros

Quando você exporta manualmente com filtros:
- Cria/atualiza a aba do mês selecionado
- Exemplo: Exportar fevereiro → `Presenca_2026_02`

### Feedback

A mensagem de sucesso mostra o nome da aba:
```
✅ Exportação concluída!

📑 Aba: Presenca_2026_02
📊 45 colaboradores exportados
📝 1350 células atualizadas

🔗 Acesse a planilha em:
https://docs.google.com/...
```

## 🎨 Personalização

### Formato do Nome

O formato é fixo: `Presenca_YYYY_MM`

**Por quê?**
- ✅ Ordenação automática
- ✅ Fácil identificação
- ✅ Padrão consistente
- ✅ Compatível com fórmulas

### Criar Abas Manualmente

Você pode criar abas adicionais:
```
Presenca_2026_01       ← Automática
Presenca_2026_02       ← Automática
Dashboard              ← Manual (seus gráficos)
Análise_Trimestral     ← Manual (suas análises)
Comparativo_Anual      ← Manual (seus relatórios)
```

**O sistema só gerencia as abas `Presenca_YYYY_MM`**

## 📊 Casos de Uso

### 1. Análise Mensal
```
Presenca_2026_02  → Dados de fevereiro
Dashboard         → Gráficos de fevereiro
```

### 2. Comparação entre Meses
```
Presenca_2026_01  → Janeiro
Presenca_2026_02  → Fevereiro
Comparativo       → Fórmulas comparando as duas abas
```

### 3. Relatório Trimestral
```
Presenca_2026_01  → Janeiro
Presenca_2026_02  → Fevereiro
Presenca_2026_03  → Março
Trimestre_Q1      → Consolidação dos 3 meses
```

### 4. Histórico Anual
```
Presenca_2026_01  → Janeiro
Presenca_2026_02  → Fevereiro
...
Presenca_2026_12  → Dezembro
Resumo_2026       → Análise anual
```

## 🔍 Logs

### Criação de Nova Aba
```
📊 ===== EXPORTAR CONTROLE DE PRESENÇA =====
📅 Mês: 2026-03
👥 Colaboradores: 45
📑 Aba de destino: Presenca_2026_03
📝 Criando nova aba "Presenca_2026_03"...
✅ Aba "Presenca_2026_03" criada com sucesso
```

### Aba Já Existe
```
📊 ===== EXPORTAR CONTROLE DE PRESENÇA =====
📅 Mês: 2026-03
👥 Colaboradores: 45
📑 Aba de destino: Presenca_2026_03
✅ Aba "Presenca_2026_03" já existe
```

## 🧪 Teste

### Script de Teste

O script de teste agora usa o mês atual:
```bash
npm run test:sheets
```

**Saída esperada:**
```
📑 Aba de teste: Presenca_2026_02
⚠️  ATENÇÃO: Aba "Presenca_2026_02" não encontrada!
   O sistema criará automaticamente esta aba na primeira exportação.
```

### Primeira Exportação

1. Acesse Controle de Presença
2. Clique em "Exportar Sheets"
3. Verifique a planilha
4. Nova aba criada automaticamente!

## 📈 Benefícios

### Antes
- ❌ Histórico perdido ao mudar de mês
- ❌ Impossível comparar meses
- ❌ Dados sobrescritos
- ❌ Sem rastreabilidade

### Depois
- ✅ Histórico completo preservado
- ✅ Fácil comparação entre meses
- ✅ Dados organizados por período
- ✅ Rastreabilidade total
- ✅ Análises temporais possíveis

## 🔧 Configuração

### Variáveis de Ambiente

Não precisa mais configurar `SHEETS_PRESENCA_ABA`!

```env
# Antes (não precisa mais)
SHEETS_PRESENCA_ABA=Controle_Presenca

# Agora (automático)
# O nome da aba é gerado automaticamente: Presenca_YYYY_MM
```

### Planilha

Apenas certifique-se de que:
- ✅ Planilha existe
- ✅ Permissões corretas (Editor)
- ✅ `SHEETS_PRESENCA_SPREADSHEET_ID` configurado

## 🎯 Próximos Passos

### Imediato
1. ✅ Reiniciar servidor
2. ✅ Fazer primeira exportação
3. ✅ Verificar aba criada

### Curto Prazo
1. 📊 Criar dashboard com dados de múltiplos meses
2. 📈 Criar gráficos de tendência
3. 📝 Criar relatórios comparativos

### Médio Prazo
1. 🔄 Aguardar mudança de mês
2. ✅ Verificar criação automática da nova aba
3. 📊 Validar histórico preservado

## ❓ FAQ

### As abas antigas são deletadas?
**Não!** Todas as abas são preservadas como histórico.

### Posso deletar abas antigas manualmente?
**Sim!** Você tem controle total. O sistema só gerencia as abas que ele cria.

### Posso renomear as abas?
**Não recomendado.** O sistema procura pelo nome exato `Presenca_YYYY_MM`.

### E se eu quiser voltar ao modelo antigo?
Basta modificar o código para usar um nome fixo ao invés de dinâmico.

### Quantas abas posso ter?
Google Sheets suporta até 200 abas por planilha.

### As abas antigas ocupam espaço?
Sim, mas Google Sheets tem limite de 10 milhões de células (muito espaço).

## 🔗 Links

- **Planilha:** https://docs.google.com/spreadsheets/d/1lgrpflaIybMq7Z-8tZ7A6cueepYZ0yNBTSyDYvNaWNk
- **Documentação:** [README_EXPORTACAO_SHEETS.md](README_EXPORTACAO_SHEETS.md)

---

**Implementado:** 06/02/2026  
**Status:** ✅ Ativo  
**Versão:** 2.0
