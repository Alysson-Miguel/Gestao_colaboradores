// Tamanho da etiqueta térmica (mm). Fica salvo neste navegador/computador, que é onde a impressora está ligada.
const CHAVE = "label_etiqueta_tamanho_mm";

export const MIN_MM = 30;
export const MAX_MM = 200;

// Pelas fotos do rolo: paisagem, proporção em torno de 1,45 (confirme medindo uma etiqueta com régua).
export const TAMANHO_PADRAO = { largura: 100, altura: 70 };

export const PRESETS = [
  { largura: 100, altura: 60 },
  { largura: 100, altura: 50 },
  { largura: 100, altura: 70 },
  { largura: 100, altura: 75 },
  { largura: 100, altura: 80 },
  { largura: 100, altura: 100 },
  { largura: 80, altura: 50 },
  { largura: 60, altura: 40 },
];

// Como a página é enviada à impressora. O driver decide o que fazer com a orientação, e isso varia
// por modelo: a calibração imprime cada modo e a pessoa escolhe o que saiu certo (fica salvo).
export const MODOS = [
  { id: "auto", rotulo: "Opção 5", detalhe: "Recomendada: usa o papel e o layout escolhidos na janela de impressão" },
  { id: "paisagem", rotulo: "Opção 1", detalhe: "Página deitada, sem girar" },
  { id: "retrato90", rotulo: "Opção 2", detalhe: "Página em pé, conteúdo girado 90° para a direita" },
  { id: "retrato270", rotulo: "Opção 3", detalhe: "Página em pé, conteúdo girado 90° para a esquerda" },
  { id: "paisagem180", rotulo: "Opção 4", detalhe: "Página deitada, conteúdo de cabeça para baixo" },
];

// O driver das impressoras de etiqueta costuma ignorar o tamanho de página enviado pelo navegador e usar o
// papel configurado nele; por isso o padrão é "auto" (vale o papel/layout da janela de impressão).
const MODO_PADRAO = "auto";
const modoValido = (id) => MODOS.some((m) => m.id === id);

export const valido = (n) => Number.isFinite(n) && n >= MIN_MM && n <= MAX_MM;

export function lerTamanhoEtiqueta() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && valido(salvo.largura) && valido(salvo.altura)) {
      // `girar` é o formato da versão anterior
      const modo = modoValido(salvo.modo) ? salvo.modo : salvo.girar ? "retrato90" : MODO_PADRAO;
      return { largura: salvo.largura, altura: salvo.altura, modo };
    }
  } catch {
    // sem armazenamento (janela privada etc.): usa o padrão
  }
  return { ...TAMANHO_PADRAO, modo: MODO_PADRAO };
}

export function salvarTamanhoEtiqueta({ largura, altura, modo = MODO_PADRAO }) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ largura, altura, modo }));
  } catch {
    // não conseguiu guardar; a impressão atual usa o valor passado
  }
}
