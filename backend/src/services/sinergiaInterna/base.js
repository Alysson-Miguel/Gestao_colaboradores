const crypto = require("crypto");

/* =====================================================
   Base compartilhada da Sinergia Interna (Label)
===================================================== */

class ErroNegocio extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ErroNegocio";
    this.status = status;
  }
}

const MOTIVOS = {
  APOIO_OPERACIONAL: "Apoio operacional",
  ABSENTEISMO: "Absenteísmo",
  PICO_OPERACIONAL: "Pico operacional",
  COBERTURA: "Cobertura",
  NECESSIDADE_HC: "Necessidade de HC",
  TREINAMENTO: "Treinamento",
  REDIMENSIONAMENTO: "Redimensionamento",
  OUTROS: "Outros",
};

// Onde a pessoa vai trabalhar no destino. Packing não cria alocação: ela entra sozinha
// pelo check-in na Workstation (a Label já lê isso automaticamente).
const FUNCOES = {
  PACKING: "Packing (automático pela Workstation)",
  PESCA: "Pesca",
  GOL: "Gol",
  ENDERECAMENTO: "Endereçamento",
  INDUCAO: "Indução",
  ABASTECEDOR: "Abastecedor",
  MONTAGEM_SCUTTLE: "5S / Montagem Scuttle",
  VOLANTE: "Volante",
  LOG_II: "LOG II",
  CONFERENTE: "Conferente",
  PUSH: "Push",
  RECEIVED: "Received",
  PULL: "Pull",
  FIFO: "FIFO",
};

const FUNCOES_ESTEIRA = ["PACKING", "PESCA", "GOL", "ENDERECAMENTO", "INDUCAO", "ABASTECEDOR", "MONTAGEM_SCUTTLE", "VOLANTE", "LOG_II"];

// Nome da esteira da Label que corresponde a cada área (Full D+1 é pool, sem esteira própria).
const NOME_ESTEIRA_DA_AREA = {
  ESTEIRA_U: "Esteira U",
  LINEAR: "Esteira Linear",
  TERMOPLASTICA: "Esteira Termoplástica",
  FULL: "Esteira FULL",
};

/** Funções que podem ser escolhidas para quem vai pra essa área (lista vazia = não pede função). */
function funcoesDaArea(area) {
  if (area.codigo === "FULL_D1") return [];
  if (area.contexto === "ESTEIRA") return FUNCOES_ESTEIRA;
  if (area.contexto === "EXPEDICAO") return ["CONFERENTE", "PUSH", "LOG_II", "VOLANTE"];
  if (area.contexto === "RECEBIMENTO") return ["RECEIVED", "PULL", "FIFO", "LOG_II", "VOLANTE"];
  return [];
}

// Estados em que o colaborador tem uma sinergia "em aberto" (impede outra).
const STATUS_ABERTOS = ["SOLICITADA", "EM_DESLOCAMENTO", "SINERGIA_ATIVA", "AGUARDANDO_RETORNO"];

// Estados em que o colaborador JÁ está fisicamente no destino (a localização operacional é o destino).
const STATUS_NO_DESTINO = ["SINERGIA_ATIVA", "AGUARDANDO_RETORNO"];

const TURNOS = ["T1", "T2", "T3"];

const normaliza = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Sem 0/O/1/I/L: o token é lido/digitado por pessoas quando a câmera falha.
const ALFABETO_TOKEN = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Token aleatório criptograficamente seguro, ex.: SYG-7K2M-XP4N-Q8RT (60 bits). Nunca carrega dado pessoal. */
function gerarToken(prefixo) {
  const grupos = [];
  for (let g = 0; g < 3; g += 1) {
    let grupo = "";
    for (let i = 0; i < 4; i += 1) grupo += ALFABETO_TOKEN[crypto.randomInt(0, ALFABETO_TOKEN.length)];
    grupos.push(grupo);
  }
  return `${prefixo}-${grupos.join("-")}`;
}

/**
 * Tokens de grupo (um QR para todos os colaboradores de um lote): SGL = ida, RGL = retorno.
 * Aceita o texto lido do QR (câmera, leitor de mão "bip" ou digitado) e devolve { tipo, token } ou null.
 * Leitores de mão digitam como um teclado e, conforme o layout/idioma, podem trocar o hífen por outro
 * símbolo ou colar espaço/quebra de linha: por isso só as letras e números contam, e o formato
 * SYG-XXXX-XXXX-XXXX / RET-XXXX-XXXX-XXXX é reconstruído.
 */
function interpretarToken(texto) {
  const limpo = String(texto || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = limpo.match(/^(SYG|RET|SGL|RGL)([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{4})$/);
  if (!m) return null;
  return {
    tipo: m[1] === "SYG" || m[1] === "SGL" ? "ida" : "retorno",
    grupo: m[1] === "SGL" || m[1] === "RGL",
    token: `${m[1]}-${m[2]}-${m[3]}-${m[4]}`,
  };
}

const ehViolacaoDeUnicidade = (err) => err && err.code === "P2002";

module.exports = {
  ErroNegocio,
  MOTIVOS,
  FUNCOES,
  FUNCOES_ESTEIRA,
  NOME_ESTEIRA_DA_AREA,
  funcoesDaArea,
  STATUS_ABERTOS,
  STATUS_NO_DESTINO,
  TURNOS,
  normaliza,
  gerarToken,
  interpretarToken,
  ehViolacaoDeUnicidade,
};
