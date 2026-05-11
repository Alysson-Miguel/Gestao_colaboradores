# Changelog

## [Atual] — 2026-05-08

### Gestão Operacional

- **Nova fonte de dados de produção** — os valores de realizado agora vêm da planilha *Produtividade OnTime* (ProdutividadeSPX), substituindo a aba Atualização_colaborador. Os dados são filtrados pela data de atualização de cada operador, evitando que produção de dias anteriores contamine o resultado do dia atual.
- **Ranking Top 15 removido** — a seção de ranking por colaborador foi descontinuada junto com a fonte de dados anterior.
- **Última atualização** — o horário exibido no dashboard agora reflete quando a planilha foi atualizada pela última vez, não quando o servidor respondeu.
- **Botão "Forçar Atualização" removido** — a atualização automática a cada 35 segundos (antes 60s) torna o botão desnecessário.
- **Loading com skeleton** — a tela preta de carregamento foi substituída por um esqueleto animado. Ao atualizar automaticamente, o conteúdo existente permanece visível enquanto os novos dados chegam — o turno selecionado não é perdido.
- **Redundância de histórico horário** — além do salvamento ao fechar o turno (T1 às 15h, T2 às 23h, T3 às 05h), o sistema agora salva os dados da hora anterior todo HH:05. Às 20:05, por exemplo, os dados das 19h são persistidos, garantindo que nenhuma hora seja perdida por uma falha no fechamento do turno.

### Processamento Geral

- **Gráfico Visão Unificada reescrito** — a linha de Meta Ajustada agora para exatamente na hora atual, sem a curva exponencial que explodía o eixo Y nas horas futuras do T3. O eixo é calculado sobre dados reais e meta original, não sobre projeções. Valores aparecem diretamente no topo de cada barra (ex: `38k`) sem precisar olhar no eixo. Faixa de performance no rodapé mostra `%` arredondado por hora.

---

## [v — pull] — 2026-05

### Colaboradores

- **Correção de data de admissão** — a data não perde mais um dia ao ser salva por conversão de fuso horário.
- **Jornada derivada do turno** — ao cadastrar ou editar um colaborador, o horário de início de jornada é preenchido automaticamente com base no turno selecionado.
- **Férias cria ausência automaticamente** — ao registrar férias ou afastamento, a ausência correspondente (FE/AFA) é criada automaticamente; o histórico de ausências aparece no perfil do colaborador.
- **Filtro de turnos dinâmico** — o filtro de turno nas listagens de colaboradores e presença agora mostra apenas os turnos cadastrados para a estação do usuário.

### Hierarquia

- **Nível de coordenadores** — adicionado o nível de coordenador na hierarquia. Líderes sem operadores vinculados aparecem corretamente. Cargos disponíveis no filtro foram expandidos.
- **Aprovação de sugestões por turno** — lideranças só visualizam e aprovam/rejeitam colaboradores do seu próprio turno. A rejeição agora persiste o motivo corretamente.

### Medidas Disciplinares

- **Progressão em 3 degraus** — a progressão disciplinar segue: 1ª ocorrência → Advertência, 2ª → Suspensão 1 dia, 3ª ou mais → Suspensão 3 dias. Casos com 4+ dias são bloqueados para automação e sinalizados com aviso de análise jurídica, exigindo revisão manual do RH.

### Atestados & Acidentes

- **Tabela com paginação server-side** — as páginas de atestados e acidentes foram reformuladas com tabela, paginação no servidor, cards de KPI e filtros por data e nome com debounce. Evidências de acidentes aceitam apenas PDF.

### Presença

- **Reinclusão após férias/afastamento** — colaboradores que retornam de férias ou afastamento voltam a aparecer corretamente no controle de presença.

### Diaristas

- **Diarias TECH** — nova empresa de diaristas adicionada ao módulo de Daily Works. Correção no planejado do T3.
- **Dashboard** — dias de folga agora aparecem no dashboard operacional.

### Folgas

- **Geração de folga dominical** — removido o backfill retroativo do processo de geração de DSR, evitando queda de conexão em bases com histórico extenso.

### Importação

- **Contato de emergência** — o campo de contato de emergência passou a ser incluído no mapeamento do import em massa de colaboradores.

### Infraestrutura

- **Redis (Upstash)** — cache conectado via Upstash Redis, reduzindo latência em consultas repetidas à planilha e ao banco.
- **Rate limiting por tier** — limites de requisição aplicados por tipo de rota: 300/min global, 10/min autenticação, 120/min dashboards, 20/min relatórios, 60/min escritas.
- **Paginação obrigatória** — atestados, usuários, medidas disciplinares, sugestões, treinamentos e acidentes agora exigem `page` e `limit`, com teto de 100 itens por página e resposta padronizada com `hasNextPage`/`hasPreviousPage`.
- **Esteiras planejadas** — configuração das esteiras aparece no dashboard operacional para usuários com perfil de liderança, usando a estação efetiva do usuário.
