# 🐛 Debug - W7 Mostrando 100% Incorretamente

## 📋 Problema
A semana W7 está mostrando 100% de conclusão quando deveria mostrar 0% (ninguém realizou ainda).

## 🔧 Alterações Aplicadas

### 1. Lógica Mais Restritiva para "Realizado"
```javascript
// ANTES (muito permissivo)
const realizado = statusLower.includes('realizado') || 
                 statusLower.includes('ok') ||
                 statusLower.includes('concluído') ||
                 statusLower.includes('concluido');

// DEPOIS (mais restritivo)
const palavrasRealizadas = ['realizado', 'concluído', 'concluido', 'completo'];
const realizado = palavrasRealizadas.some(palavra => statusLower === palavra) ||
                 statusLower === 'ok' ||
                 statusLower.startsWith('realizado') ||
                 statusLower.startsWith('concluído') ||
                 statusLower.startsWith('concluido');
```

**Diferença:**
- `includes('ok')` → Qualquer texto com "ok" seria realizado (ex: "Booking", "Outlook")
- `=== 'ok'` → Apenas o texto exato "ok" é realizado

### 2. Logs de Debug Adicionados
- Log de cada pessoa da W6 e W7 mostrando o texto original da célula
- Log de todas as semanas encontradas na planilha
- Log dos primeiros 3 registros de cada semana filtrada
- Log do cálculo da semana atual

## 🧪 Como Testar

### Passo 1: Reiniciar o Backend
```bash
cd backend
npm start
```

### Passo 2: Acessar a Página
1. Abra o frontend
2. Navegue até Safety Walk
3. Clique em "Esta Semana (W7)"

### Passo 3: Verificar os Logs do Backend
Procure por estas linhas no console do backend:

```
📅 Cálculo de semana atual: { hoje: '2026-02-09', semanaCalculada: 7, resultado: 'W7' }
📅 Semanas encontradas na planilha: ['W5', 'W6', 'W7', 'W8', ...]
🔍 W7 Debug - Nome Pessoa (T1): "texto da célula" → REALIZADO/PENDENTE
📊 Status dos registros filtrados: { REALIZADO: X, PENDENTE: Y }
📋 Primeiros 3 registros da W7:
   - Pessoa 1 (T1): PENDENTE - "texto original"
   - Pessoa 2 (T2): PENDENTE - "texto original"
   - Pessoa 3 (T3): PENDENTE - "texto original"
```

## 🔍 O Que Procurar nos Logs

### Cenário 1: Texto Inesperado na Célula
Se você ver algo como:
```
🔍 W7 Debug - João Silva (T1): "Outlook" → REALIZADO
```
**Problema:** A célula contém "Outlook" que tem "ok" no meio
**Solução:** ✅ Já corrigido com `statusLower === 'ok'`

### Cenário 2: Semana Errada Sendo Filtrada
Se você ver:
```
📅 Filtrando pela semana atual: W8
```
Mas deveria ser W7
**Problema:** Cálculo de semana está errado
**Solução:** Ajustar a função `calcularSemanaAtual()`

### Cenário 3: Registros de Outras Semanas
Se você ver registros da W6 aparecendo quando filtrou W7
**Problema:** Filtro não está funcionando
**Solução:** ✅ Já corrigido usando `registrosFiltrados`

## 📊 Possíveis Causas

### Causa 1: Texto na Planilha
A célula pode conter texto que tem "ok", "realizado" ou similar:
- ❌ "Outlook" → contém "ok"
- ❌ "Booking" → contém "ok"  
- ❌ "Não realizado" → contém "realizado"
- ✅ "Pendente" → não contém nenhuma palavra-chave
- ✅ "" (vazio) → não é contabilizado

### Causa 2: Cálculo de Semana
A semana atual pode estar sendo calculada errada:
- Hoje: 09/02/2026 (segunda-feira)
- Deveria ser: W7
- Se estiver calculando W6 ou W8, o filtro vai pegar dados errados

### Causa 3: Filtro Não Aplicado
O `conclusaoPorTurno` pode estar usando `registros` em vez de `registrosFiltrados`
- ✅ Já corrigido na linha 327

## ✅ Próximos Passos

1. **Reinicie o backend** com as novas alterações
2. **Acesse a W7** no frontend
3. **Copie os logs** do backend e me envie
4. **Verifique a planilha** do Google Sheets:
   - Abra a aba "Report SPI"
   - Encontre a linha da W7
   - Veja o que está escrito nas células de cada pessoa
   - Tire um print se possível

Com essas informações, vou conseguir identificar exatamente o que está causando o problema!

## 🎯 Resultado Esperado

Após as correções, para a W7 (se ninguém realizou ainda):
- Total de Pessoas: 38
- Realizadas: 0
- Pendentes: 38
- Taxa de Conclusão: 0%
- T1: 0%
- T2: 0%
- T3: 0%
