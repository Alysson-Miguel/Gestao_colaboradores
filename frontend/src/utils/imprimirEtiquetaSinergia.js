import QRCode from "qrcode";
import { lerTamanhoEtiqueta } from "./etiquetaTamanho";

/* =====================================================
   Etiqueta térmica da Sinergia Interna.
   Tamanho configurável em mm (padrão 100 × 60, paisagem): em etiqueta mais larga que alta o QR fica
   à esquerda e os dados à direita; em etiqueta quadrada/vertical, tudo empilhado.
   O QR carrega APENAS o token (nenhum dado pessoal).
===================================================== */

const escapar = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const arredondar = (n) => Math.round(n * 10) / 10;

function medidas({ largura, altura }) {
  const paisagem = largura >= altura * 1.2;
  // tudo escala pela menor razão entre o tamanho real e o de referência (100 × 60)
  const f = Math.min(largura / 100, altura / 60);
  const pad = arredondar(Math.max(2, 3 * f));
  const tokenAlt = arredondar(5 * f); // faixa do código escrito sob o QR
  const qr = paisagem
    ? arredondar(Math.min(altura - 2 * pad - tokenAlt, largura * 0.42))
    : arredondar(Math.min(largura - 2 * pad, altura * 0.5));
  return { paisagem, f, pad, qr, tokenAlt };
}

/** Réguas (a cada 10 mm) e marcas de topo/esquerda: mostram na etiqueta física como a página foi posicionada. */
function regua({ largura, altura }) {
  const marcas = (total, eixo) =>
    Array.from({ length: Math.floor(total / 10) + 1 }, (_, i) => i * 10)
      .map((v) => `<span class="marca ${eixo}" style="${eixo === "h" ? "left" : "top"}:${v}mm">${v}</span>`)
      .join("");
  return `<div class="regua">${marcas(largura, "h")}${marcas(altura, "v")}<span class="topo">&#9650; TOPO</span><span class="esq">ESQ</span></div>`;
}

function htmlDosDadosDoGrupo(e, retorno, tamanho, m) {
  // quantos nomes cabem na altura da etiqueta (o resto vira "+ N")
  const maxNomes = Math.max(3, Math.floor((tamanho.altura - 2 * m.pad - 30 * m.f) / (3.6 * m.f)));
  const nomes = e.colaboradores.length > maxNomes ? e.colaboradores.slice(0, maxNomes - 1) : e.colaboradores;
  const resto = e.colaboradores.length - nomes.length;
  return `
      <p class="tipo">${retorno ? "SINERGIA · GRUPO · RETORNO" : "SINERGIA INTERNA · GRUPO"}</p>
      <p class="rotulo">${e.total} COLABORADORES</p>
      <ul class="nomes">${nomes.map((n) => `<li>${escapar(n)}</li>`).join("")}${resto > 0 ? `<li class="mais">+ ${resto} colaboradores</li>` : ""}</ul>
      <p class="linha"><span class="rotulo">ORIGEM</span><span class="area">${escapar(e.origem)}</span></p>
      <p class="linha"><span class="rotulo">DESTINO</span><span class="area">${escapar(e.destino)}</span></p>
      <p class="turno"><span class="rotulo">TURNO</span> ${escapar(e.turno)}</p>
      <p class="instrucao">${retorno ? "UM bip no setor de ORIGEM confirma o retorno de TODOS" : "UM bip no setor de DESTINO confirma a chegada de TODOS"}</p>`;
}

function htmlDaEtiqueta(e, qr, m, teste, tamanho) {
  const retorno = e.tipo === "retorno";
  const dados = e.grupo
    ? htmlDosDadosDoGrupo(e, retorno, tamanho, m)
    : `
      <p class="tipo">${retorno ? "SINERGIA INTERNA · RETORNO" : "SINERGIA INTERNA"}</p>
      <p class="rotulo">COLABORADOR</p>
      <p class="nome">${escapar(e.colaborador)}</p>
      <p class="linha"><span class="rotulo">ORIGEM</span><span class="area">${escapar(e.origem)}</span></p>
      <p class="linha"><span class="rotulo">DESTINO</span><span class="area">${escapar(e.destino)}</span></p>
      <p class="turno"><span class="rotulo">TURNO</span> ${escapar(e.turno)}</p>
      <p class="instrucao">${retorno ? "Escanear no setor de ORIGEM para confirmar o retorno" : "Escanear no setor de DESTINO para confirmar a chegada"}</p>`;
  return `
    <div class="pagina"><section class="etiqueta ${m.paisagem ? "paisagem" : "vertical"} ${teste ? "teste" : ""}">
      <div class="coluna-qr">
        <img class="qr" src="${qr}" alt="QR Code" />
        <p class="token">${escapar(e.token)}</p>
      </div>
      <div class="coluna-dados">${dados}</div>
      ${teste ? `<span class="medida">${teste}</span>${regua(tamanho)}` : ""}
    </section></div>`;
}

// modo -> página enviada ao driver e giro do conteúdo dentro dela
function geometria({ largura, altura, modo, girar }) {
  const m = modo || (girar ? "retrato90" : "paisagem");
  const emPe = m === "retrato90" || m === "retrato270";
  const posicao = { auto: "left:0;top:0;", paisagem: "left:0;top:0;", paisagem180: "left:0;top:0;transform-origin:50% 50%;transform:rotate(180deg);", retrato90: `left:${altura}mm;top:0;transform-origin:0 0;transform:rotate(90deg);`, retrato270: `left:0;top:${largura}mm;transform-origin:0 0;transform:rotate(-90deg);` }[m];
  return { auto: m === "auto", emPe, posicao, paginaLargura: emPe ? altura : largura, paginaAltura: emPe ? largura : altura };
}

function estilo(tamanho, m) {
  const { largura, altura } = tamanho;
  const g = geometria(tamanho);
  // "auto": não impõe o tamanho da página; vale o papel e o layout escolhidos na janela de impressão
  const pagina = g.auto ? "auto" : `${g.paginaLargura}mm ${g.paginaAltura}mm`;
  const pt = (n) => `${arredondar(n * m.f)}pt`;
  const mm = (n) => `${arredondar(n * m.f)}mm`;
  return `
  @page { size: ${pagina}; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; }
  .pagina { position: relative; width: ${g.paginaLargura}mm; height: ${g.paginaAltura}mm; overflow: hidden; page-break-after: always; break-after: page; }
  .pagina:last-child { page-break-after: auto; break-after: auto; }
  .etiqueta { position: absolute; ${g.posicao} width: ${largura}mm; height: ${altura}mm; padding: ${m.pad}mm; overflow: hidden; display: flex; gap: ${mm(3)}; }
  .etiqueta.paisagem { flex-direction: row; align-items: center; }
  .etiqueta.vertical { flex-direction: column; align-items: center; text-align: center; }
  .coluna-qr { flex: none; display: flex; flex-direction: column; align-items: center; }
  .qr { width: ${m.qr}mm; height: ${m.qr}mm; display: block; image-rendering: pixelated; }
  .token { font-family: "Courier New", monospace; font-weight: 700; font-size: ${pt(7.5)}; letter-spacing: .3px; margin: ${mm(1)} 0 0; white-space: nowrap; }
  .coluna-dados { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .vertical .coluna-dados { flex: none; width: 100%; }
  .tipo { font-size: ${pt(9)}; font-weight: 800; letter-spacing: .4px; margin: 0 0 ${mm(1.5)}; padding-bottom: ${mm(1.2)}; border-bottom: ${mm(0.4)} solid #000; }
  .rotulo { font-size: ${pt(5.5)}; font-weight: 700; letter-spacing: .8px; margin: ${mm(1.2)} 0 0; }
  .nome { font-size: ${pt(12.5)}; font-weight: 800; line-height: 1.12; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .linha { display: flex; align-items: baseline; gap: ${mm(1.5)}; margin: ${mm(1)} 0 0; }
  .vertical .linha { justify-content: center; }
  .linha .rotulo { margin: 0; flex: none; min-width: ${mm(11)}; text-align: left; }
  .area { font-size: ${pt(9.5)}; font-weight: 800; line-height: 1.1; }
  .turno { font-size: ${pt(11)}; font-weight: 800; margin: ${mm(0.8)} 0 0; }
  .turno .rotulo { margin-right: ${mm(1)}; }
  .nomes { list-style: none; margin: ${mm(0.8)} 0 0; padding: 0; }
  .nomes li { font-size: ${pt(8)}; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nomes li.mais { font-weight: 800; }
  .instrucao { font-size: ${pt(5.5)}; margin: ${mm(1.2)} 0 0; line-height: 1.2; }
  .etiqueta.teste { outline: ${mm(0.3)} dashed #000; outline-offset: -${mm(0.3)}; }
  .regua { position: absolute; inset: 0; pointer-events: none; font-size: 5pt; font-weight: 700; }
  .marca { position: absolute; line-height: 1; }
  .marca.h { top: 0; border-left: 0.2mm solid #000; padding: 0 0 0 0.4mm; height: 2.5mm; }
  .marca.v { left: 0; border-top: 0.2mm solid #000; padding: 0.3mm 0 0 0.4mm; width: 2.5mm; }
  .marca.v { writing-mode: horizontal-tb; }
  .topo { position: absolute; top: 3mm; left: 50%; transform: translateX(-50%); font-size: 7pt; font-weight: 800; background: #fff; padding: 0 1mm; }
  .esq { position: absolute; left: 3mm; top: 50%; transform: translateY(-50%); font-size: 7pt; font-weight: 800; background: #fff; padding: 0 1mm; }
  .medida { position: absolute; right: ${mm(1.5)}; bottom: ${mm(1)}; font-size: ${pt(6)}; font-weight: 700; background: #fff; padding: 0 ${mm(1)}; }
  `;
}

/** Imprime uma ou várias etiquetas (uma por etiqueta física). Recebe os dados de `GET /:id/etiqueta`. */
export async function imprimirEtiquetasSinergia(etiquetas, { tamanho = lerTamanhoEtiqueta(), teste = null } = {}) {
  const lista = Array.isArray(etiquetas) ? etiquetas : [etiquetas];
  const m = medidas(tamanho);
  // margem de 2 módulos: cabe em etiqueta pequena e o leitor de mão ainda lê com folga
  const qrs = await Promise.all(
    lista.map((e) => QRCode.toDataURL(e.token, { errorCorrectionLevel: "M", margin: 2, scale: 12, color: { dark: "#000000", light: "#FFFFFF" } }))
  );

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Etiquetas de sinergia</title><style>${estilo(tamanho, m)}</style></head><body>${lista
    .map((e, i) => htmlDaEtiqueta(e, qrs[i], m, teste, tamanho))
    .join("")}</body></html>`;

  // iframe oculto: não depende de pop-up liberado e não navega a tela do operador.
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  await new Promise((resolve) => {
    iframe.onload = resolve;
    iframe.srcdoc = html;
  });

  const janela = iframe.contentWindow;
  janela.focus();
  janela.print();
  // dá tempo da caixa de impressão abrir antes de remover o iframe
  setTimeout(() => iframe.remove(), 60000);
}

/** Etiqueta de teste: mesmo layout, com o contorno e a medida impressos, para conferir o encaixe no rolo. */
export function imprimirEtiquetaTeste(tamanho, rotuloOpcao = "") {
  return imprimirEtiquetasSinergia(
    [
      {
        tipo: "ida",
        colaborador: "NOME COMPLETO DO COLABORADOR DE TESTE",
        origem: "Esteira Termoplástica",
        destino: "Esteira U",
        turno: "T3",
        token: "SYG-TEST-0000-0000",
      },
    ],
    { tamanho, teste: `${rotuloOpcao ? `${rotuloOpcao.toUpperCase()} · ` : ""}${tamanho.largura} × ${tamanho.altura} mm` }
  );
}
