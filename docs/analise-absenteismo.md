# Analise de Absenteismo

## Resumo executivo

No projeto, a base conceitual de absenteismo e praticamente a mesma na maior parte das telas:

- existe um universo de colaboradores elegiveis
- existe um conjunto de dias/registros que entram no HC apto
- existe um conjunto de status que impactam absenteismo
- o calculo principal, quando a tela mede taxa, segue a ideia de:

```text
absenteismo = ausencias / HC apto
```

Mesmo assim, o sistema nao usa uma unica implementacao central. Ha variacoes por controlador e por dashboard. Entao, no geral, a base e a mesma, mas algumas paginas adicionam filtros, fontes auxiliares ou interpretacoes diferentes.

## Estruturas principais

O tema envolve principalmente estas entidades:

- `Frequencia`
- `TipoAusencia`
- `AtestadoMedico`
- `Colaborador`

Arquivos de referencia:

- [backend/prisma/schema.prisma](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/prisma/schema.prisma)
- [backend/prisma/seed.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/prisma/seed.js)

## Codigos de ausencia relevantes

Os codigos mais importantes para absenteismo sao:

- `P` = Presenca
- `F` = Falta
- `AM` = Atestado Medico
- `AA` = Atestado de Acompanhamento
- `DSR` = Descanso Semanal Remunerado
- `FO` = Folga
- `FE` = Ferias
- `S1` = Sinergia Enviada
- `NC` = Nao contratado
- `ON` = Onboarding
- `AFA` / `AF` = Afastamento
- `LM` / `LP` = Licencas

## Regra logica central

Quase toda a logica de absenteismo pode ser reduzida a dois flags:

- `contaComoEscalado`
- `impactaAbsenteismo`

Interpretacao:

- se `contaComoEscalado = true`, o dia entra no denominador
- se `impactaAbsenteismo = true`, o dia entra no numerador

Em regra:

- `Presente` entra no HC apto e nao impacta
- `Falta` entra no HC apto e impacta
- `Atestado` entra no HC apto e impacta
- `DSR`, `Ferias`, `NC`, `ON`, `Afastamentos` normalmente ficam fora do HC apto
- `S1` normalmente entra no HC apto e nao impacta

## Onde o calculo aparece

### 1. Dashboard Operacional

Arquivo:

- [backend/src/controllers/dashboard.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/dashboard.controller.js)

Leitura principal:

```text
absenteismoPeriodo = totalAusenciasDias / totalHcAptoDias * 100
```

Essa e a visao mais classica de taxa de absenteismo operacional.

### 2. Dashboard Admin

Arquivo:

- [backend/src/controllers/dashboardAdmin.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/dashboardAdmin.controller.js)

Tambem trabalha com a mesma ideia base:

```text
absenteismo = absDias / diasEsperados * 100
```

Na pratica, continua sendo uma relacao entre dias impactados e base apta do periodo.

### 3. Dashboard de Colaboradores

Arquivo:

- [backend/src/controllers/dashboardColaboradores.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/dashboardColaboradores.controller.js)

Tambem usa a ideia de:

```text
absenteismoPeriodo = totalAusenciasDias / totalHcAptoDias * 100
```

Mas com um recorte proprio, principalmente voltado ao universo BPO.

### 4. Dashboard dedicado de Absenteismo

Arquivos:

- [backend/src/controllers/absenteismo.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/absenteismo.controller.js)
- [frontend/src/pages/dashboards/DashboardAbsenteismo.jsx](C:/Users/SPXBR30172/Documents/gestao-colaboradores/frontend/src/pages/dashboards/DashboardAbsenteismo.jsx)

Aqui esta a maior diferenca. Essa tela nao mede apenas taxa classica. Ela consolida:

- faltas unicas
- quantidade de atestados
- dias afastados
- colaboradores impactados
- recorrencia
- percentual de HC impactado

Ou seja: e uma tela de consolidado de ausencia, nao so de taxa de absenteismo.

## Papel do ponto e da presenca

O modulo de ponto influencia diretamente o absenteismo.

Arquivo:

- [backend/src/controllers/ponto.controller.js](C:/Users/SPXBR30172/Documents/gestao-colaboradores/backend/src/controllers/ponto.controller.js)

Ele afeta o tema porque:

- bloqueia ponto quando ha ausencia ou atestado ativo
- determina como o dia aparece no controle mensal
- permite ajuste manual de presenca
- materializa o status final que depois sera lido pelos dashboards

No controle mensal, a prioridade pratica e:

1. atestado
2. ajuste manual
3. ausencia administrativa
4. frequencia do dia
5. DSR
6. sem lancamento

## Resposta curta para a pergunta principal

Sim: no geral, a base de absenteismo e a mesma.

Quase todas as paginas partem da mesma ideia:

- definir quem faz parte da base
- definir quais dias contam como escalados
- definir quais eventos contam como ausencia

Mas nao e 100% a mesma implementacao em todo lugar. Algumas paginas so acrescentam detalhes, enquanto outras mudam o recorte ou a metrica final.

## Onde so existem detalhes a mais

Estas telas seguem a mesma base conceitual e mudam mais o recorte do que a logica:

- `dashboard.controller.js`
- `dashboardAdmin.controller.js`
- `dashboardColaboradores.controller.js`

As diferencas principais entre elas sao:

- filtro por turno
- filtro por empresa
- filtro por estacao
- filtro por tipo de colaborador
- distribuicoes por lider, setor, escala e genero
- rankings e tendencias

Nelas, o nucleo do calculo continua essencialmente o mesmo.

## Onde ha diferenca real de interpretacao

### Dashboard dedicado de absenteismo

O dashboard dedicado de absenteismo nao mostra apenas taxa. Ele mistura varias leituras:

- eventos de ausencia
- dias perdidos
- impacto no HC
- recorrencia

Entao ele compartilha a base, mas a camada de apresentacao e a agregacao sao diferentes.

### Regras diferentes por universo

Ha divergencias de populacao entre telas, por exemplo:

- uma tela inclui `PCD`
- outra exclui `PCD`
- uma considera apenas BPO
- outra considera base mais ampla

Isso faz o numero final mudar mesmo quando a formula parece igual.

### Tratamento diferente de alguns codigos

O principal caso encontrado foi `FO`.

Em alguns pontos:

- `FO` entra como escalado e nao impacta

Em outro:

- `FO` fica fora do HC apto

Isso muda o denominador e, portanto, a taxa final.

## Principais inconsistencias encontradas

1. Nao existe uma funcao unica central de absenteismo usada por todo o backend.
2. O dashboard dedicado de absenteismo nao mede apenas a taxa classica.
3. O universo de colaboradores muda entre telas.
4. Alguns codigos, como `FO`, nao sao tratados de forma identica.
5. Parte das telas usa `Frequencia` como fonte principal, enquanto a tela dedicada tambem depende fortemente de `AtestadoMedico`.

## Conclusao

A leitura correta e esta:

- sim, existe uma base comum de absenteismo no sistema
- sim, varias paginas so adicionam visoes, filtros e detalhes em cima dessa base
- mas nao, o sistema ainda nao esta totalmente padronizado

Hoje o projeto tem um nucleo comum com implementacoes paralelas. Isso significa que a ideia geral e a mesma, mas alguns detalhes de elegibilidade, status e agregacao ainda fazem os numeros variarem entre telas.

## Recomendacao tecnica

Se o objetivo for unificar totalmente o tema, o ideal e:

1. criar uma funcao central unica para classificar o status do dia
2. padronizar o universo elegivel por tipo de dashboard
3. separar explicitamente as metricas:

- `taxaAbsenteismo`
- `eventosAusencia`
- `diasPerdidos`
- `hcImpactado`
- `recorrencia`

4. deixar no frontend e na API o nome correto de cada indicador

Assim, as telas continuam podendo ter detalhes proprios, mas sem parecer que cada uma calcula uma coisa diferente.
