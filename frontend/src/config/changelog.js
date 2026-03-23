/**
 * CHANGELOG — atualize este arquivo a cada deploy.
 *
 * version: deve bater com APP_VERSION no .env do backend.
 * items: lista de novidades exibidas no modal.
 */
const CHANGELOG = {
  version: "1.2.0",
  titulo: "Novidades desta atualização",
  items: [
    "Dashboard de Desligamento",
    "DDSMA: novo cálculo de progresso diário (X/5 por semana)",
    "DDSMA: cargos isentos removidos do cálculo (Supervisor, Analista, HSE, etc)",
    "DDSMA: célula vazia exclui responsável dos pendentes",
    "DDSMA: semanas futuras ocultadas no filtro de semana",
    "SPI: tela de carregamento substituída por skeleton animado",
    "Motivos de desligamento atualizados (No Show, Compliance, Abandono, Não conformidade)",
  ],
};

export default CHANGELOG;
