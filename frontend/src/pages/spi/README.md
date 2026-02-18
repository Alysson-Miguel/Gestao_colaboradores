# Dashboard SPI - Sistema de Performance Integrado

## 📋 Descrição

Dashboard unificado que combina os indicadores de **Safety Walk**, **DDSMA** e **OPA** em uma única interface visual e intuitiva. Esta é a página principal para visualização de todos os indicadores de segurança.

## ✨ Características

### 🎯 Visão Consolidada
- Cards interativos em grid 3 colunas mostrando métricas de Safety Walk, DDSMA e OPA
- Clique nos cards para alternar entre as visualizações
- Indicador visual da aba ativa com 3 barras coloridas
- Carregamento simultâneo de todos os indicadores

### 📊 Métricas Exibidas
- **Total de Pessoas**: Quantidade total de responsáveis
- **Realizadas**: Inspeções/diálogos/observações concluídas
- **Pendentes**: Inspeções/diálogos/observações aguardando realização
- **Taxa de Conclusão**: Percentual de aderência

### 🎨 Visualizações Diferenciadas
- **Safety Walk**: Gráficos de barras horizontais por turno
- **DDSMA**: Gráficos circulares (donut charts) por turno
- **OPA**: Gráficos de barras verticais comparativas por turno

### 🔍 Filtros Disponíveis
- Período: Semana atual ou semana específica
- Turno: Todos, T1, T2, T3, ADM
- Atualização em tempo real

### 📈 Seções do Dashboard
1. **Cards Consolidados**: Visão geral dos três indicadores
2. **Tabelas de Responsáveis**: Pendentes e realizados lado a lado
3. **Aderência por Turno**: Visualização específica por turno (diferente para cada indicador)
4. **Aderência Geral**: Comparativo consolidado de todos os turnos

## 🎨 Design

- Tema escuro consistente com o resto da aplicação
- Cores semânticas:
  - 🟢 Verde (#34C759): Realizadas / Alta aderência (≥80%)
  - 🟠 Laranja (#FF9F0A): Pendentes / Média aderência (50-79%)
  - 🔴 Vermelho (#FF453A): Baixa aderência (<50%)
  - 🔵 Azul (#007AFF): Safety Walk
  - 🟡 Amarelo (#FF9F0A): DDSMA
  - 🔴 Vermelho (#FF453A): OPA

## 🚀 Acesso

Navegue para `/spi` ou acesse através do menu lateral:
**Dashboards → SPI**

## 🔐 Permissões

Acessível para usuários com roles:
- ADMIN
- LIDERANCA
- GESTAO

## 📝 Notas

- As páginas individuais de Safety Walk e DDSMA foram removidas
- Toda a funcionalidade agora está consolidada nesta página única
- Facilita a comparação entre os três indicadores
- Interface mais limpa e intuitiva
- Todos os indicadores (Safety Walk, DDSMA e OPA) estão integrados com Google Sheets

## 🔧 Configuração Backend

### Google Sheets
Os dados são lidos da mesma planilha do Google Sheets:
- **Safety Walk**: Intervalo A6:AZ57
- **DDSMA**: Intervalo A59:AZ110
- **OPA**: Intervalo B112:AZ163

### Variáveis de Ambiente
```env
SHEETS_OPA_SPREADSHEET_ID=1maB_sUQ-J5oVYUNJWuN5om19qjoSfX-aOnYakmlw0aI
SHEETS_OPA_ABA=Report SPI
GOOGLE_CLIENT_EMAIL=seu-email@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=sua-chave-privada
```
