// Matemática de layout do mapa visual das esteiras — portada de
// layoutStraight_/layoutU_ (App.html do "Mapa Interativo da Operação" legado),
// adaptada para retornar coordenadas puras (sem HTML/CSS), consumidas pelo
// ConveyorSvg.jsx no visual novo do COPEOPLE.

const ARM_WIDTH = 40;
const ARM_LENGTH = 84;
const ARM_GAP = 28;
const BELT_THICKNESS = 40;
const MARGIN_TOP_BOTTOM = 70;
const U_LEG_GAP = 180;
const U_CAP_PAD = 30;

function layoutLinha(qtdBracos, temLadoA, temLadoB) {
  const slotWidth = ARM_WIDTH + ARM_GAP;
  const totalWidth = qtdBracos * slotWidth + ARM_GAP;

  const topoY = MARGIN_TOP_BOTTOM;
  const beltY = topoY + (temLadoB ? ARM_LENGTH : 0);
  const baseY = beltY + BELT_THICKNESS;
  const totalHeight = baseY + (temLadoA ? ARM_LENGTH : 0) + MARGIN_TOP_BOTTOM;

  const bracos = {};
  for (let i = 1; i <= qtdBracos; i++) {
    const x = ARM_GAP + (i - 1) * slotWidth;
    const cx = x + ARM_WIDTH / 2;

    if (temLadoB) {
      bracos[`${i}-B`] = { numero: i, lado: "B", x, y: topoY, w: ARM_WIDTH, h: ARM_LENGTH, cx, cy: topoY + ARM_LENGTH / 2 };
    }
    if (temLadoA) {
      bracos[`${i}-A`] = { numero: i, lado: "A", x, y: baseY, w: ARM_WIDTH, h: ARM_LENGTH, cx, cy: baseY + ARM_LENGTH / 2 };
    }
  }

  return {
    formato: "LINHA",
    largura: totalWidth,
    altura: totalHeight,
    bracos,
    esteira: { tipo: "rect", x: ARM_GAP / 2, y: beltY, largura: totalWidth - ARM_GAP, altura: BELT_THICKNESS },
  };
}

function layoutU(qtdBracos, temLadoA, temLadoB) {
  const slotWidth = ARM_WIDTH + ARM_GAP;
  const pernaComprimento = qtdBracos * slotWidth + ARM_GAP;

  const pernaBExternaY = MARGIN_TOP_BOTTOM + ARM_LENGTH;
  const pernaBCentroY = pernaBExternaY + BELT_THICKNESS / 2;
  const pernaBInternaY = pernaBExternaY + BELT_THICKNESS;

  const pernaAInternaY = pernaBInternaY + U_LEG_GAP;
  const pernaACentroY = pernaAInternaY + BELT_THICKNESS / 2;
  const pernaAExternaY = pernaAInternaY + BELT_THICKNESS;

  const totalHeight = pernaAExternaY + ARM_LENGTH + MARGIN_TOP_BOTTOM;
  const raio = (pernaACentroY - pernaBCentroY) / 2;
  const capCentroX = U_CAP_PAD + raio;
  const pernaEsquerdaX = capCentroX;
  const pernaDireitaX = pernaEsquerdaX + pernaComprimento;
  const totalWidth = pernaDireitaX + MARGIN_TOP_BOTTOM;

  const bracos = {};
  for (let i = 1; i <= qtdBracos; i++) {
    const cx = pernaEsquerdaX + ARM_GAP + (i - 1) * slotWidth + ARM_WIDTH / 2;

    if (temLadoB) {
      bracos[`${i}-B`] = { numero: i, lado: "B", x: cx - ARM_WIDTH / 2, y: pernaBExternaY - ARM_LENGTH, w: ARM_WIDTH, h: ARM_LENGTH, cx, cy: pernaBExternaY - ARM_LENGTH / 2 };
    }
    if (temLadoA) {
      bracos[`${i}-A`] = { numero: i, lado: "A", x: cx - ARM_WIDTH / 2, y: pernaAExternaY, w: ARM_WIDTH, h: ARM_LENGTH, cx, cy: pernaAExternaY + ARM_LENGTH / 2 };
    }
  }

  const pathD =
    `M ${pernaDireitaX} ${pernaBCentroY} ` +
    `L ${capCentroX} ${pernaBCentroY} ` +
    `A ${raio} ${raio} 0 0 0 ${capCentroX} ${pernaACentroY} ` +
    `L ${pernaDireitaX} ${pernaACentroY}`;

  return {
    formato: "U",
    largura: totalWidth,
    altura: totalHeight,
    bracos,
    esteira: { tipo: "path", d: pathD, espessura: BELT_THICKNESS },
  };
}

export function calcularLayoutEsteira(esteira) {
  const { formato, qtdBracos, temLadoA, temLadoB } = esteira;
  return formato === "U"
    ? layoutU(qtdBracos, temLadoA, temLadoB)
    : layoutLinha(qtdBracos, temLadoA, temLadoB);
}
