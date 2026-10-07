import { useState } from "react";
import { calcularLayoutEsteira } from "../../utils/esteiraLayout";

const COR_MANUAL = "#FA4C00";
const COR_DIARISTA = "#A855F7";
const COR_AUTO = "#22C55E";
export const COR_PESCA = "#2563EB";

// Neutros vêm das variáveis do tema, pra o desenho acompanhar claro/escuro.
const NEUTRO_BORDA = "var(--color-border)";
const NEUTRO_FUNDO = "var(--color-surface-2)";
const NEUTRO_TEXTO = "var(--color-muted)";

function corDoBraco(alocacao, habilitado) {
  if (!habilitado) return { fill: NEUTRO_FUNDO, stroke: NEUTRO_BORDA };
  if (!alocacao) return { fill: "transparent", stroke: NEUTRO_BORDA };
  if (alocacao.diarista) return { fill: `${COR_DIARISTA}26`, stroke: COR_DIARISTA };
  if (alocacao.origem === "AUTO") return { fill: `${COR_AUTO}26`, stroke: COR_AUTO };
  return { fill: `${COR_MANUAL}26`, stroke: COR_MANUAL };
}

function primeiroNome(nomeCompleto) {
  if (!nomeCompleto) return "";
  return nomeCompleto.split(" ")[0];
}

function descricaoDoBraco(braco, alocacao, pescas = []) {
  const nome = `Braço ${braco.numero}${braco.lado}`;
  if (!braco.habilitado) return `${nome}: desabilitado`;
  const partes = [];
  if (alocacao?.origem === "AUTO") {
    const n = alocacao.totalColaboradores;
    partes.push(`${n} ${n === 1 ? "pessoa" : "pessoas"} via Workstation`);
  } else if (alocacao?.diarista) partes.push("diarista");
  else if (alocacao) partes.push(alocacao.colaborador?.nomeCompleto || "alocado");
  if (pescas.length) {
    partes.push(`${pescas.length} ${pescas.length === 1 ? "pesca" : "pescas"}: ${pescas.map((p) => p.diarista ? "diarista" : p.colaborador?.nomeCompleto || p.opsId).join(", ")}`);
  }
  return partes.length ? `${nome}: ${partes.join("; ")}` : `${nome}: livre`;
}

/**
 * Desenho da esteira. Cada braço é um botão (teclado e leitor de tela).
 * Em turno histórico (`somenteLeitura`) só os braços automáticos abrem — o
 * resto não tem ação, então também não parece clicável.
 */
export default function ConveyorSvg({
  esteira,
  alocacoes = [],
  pescas = [],
  arrastando = false,
  destinoAtivo = null,
  scrollRef,
  onBracoClick,
  somenteLeitura = false,
}) {
  const [hover, setHover] = useState(null);
  const [foco, setFoco] = useState(null);
  const layout = calcularLayoutEsteira(esteira);

  const alocacaoPorChave = {};
  alocacoes.forEach((a) => {
    if (a.braco != null && a.lado) alocacaoPorChave[`${a.braco}-${a.lado}`] = a;
  });

  const pescasPorChave = {};
  pescas.forEach((p) => {
    if (p.braco == null || !p.lado) return;
    const chave = `${p.braco}-${p.lado}`;
    (pescasPorChave[chave] = pescasPorChave[chave] || []).push(p);
  });

  const bracosConfig = esteira.bracos || [];

  return (
    // Em tela estreita o desenho mantém um tamanho legível e rola dentro do próprio painel.
    <div ref={scrollRef} className="overflow-x-auto -mx-2 px-2">
      <svg
        viewBox={`0 0 ${layout.largura} ${layout.altura}`}
        className="w-full h-auto min-w-[720px]"
        style={{ maxHeight: 520 }}
        role="group"
        aria-label={`Mapa da ${esteira.nome}`}
      >
        {layout.esteira.tipo === "rect" ? (
          <rect
            x={layout.esteira.x}
            y={layout.esteira.y}
            width={layout.esteira.largura}
            height={layout.esteira.altura}
            rx={8}
            style={{ fill: NEUTRO_FUNDO, stroke: NEUTRO_BORDA }}
            opacity={0.6}
          />
        ) : (
          <path
            d={layout.esteira.d}
            fill="none"
            style={{ stroke: NEUTRO_FUNDO }}
            strokeWidth={layout.esteira.espessura}
            strokeLinecap="round"
            opacity={0.6}
          />
        )}

        {bracosConfig.map((braco) => {
          const chave = `${braco.numero}-${braco.lado}`;
          const pos = layout.bracos[chave];
          if (!pos) return null;

          const alocacao = alocacaoPorChave[chave];
          const pescasDoBraco = pescasPorChave[chave] || [];
          const cores = corDoBraco(alocacao, braco.habilitado);
          const interativo = braco.habilitado && (!somenteLeitura || alocacao?.origem === "AUTO");
          const livreAtivo = interativo && !alocacao;
          const destacado = hover === chave && livreAtivo && !arrastando;
          const comFoco = foco === chave;
          const alvoDeSoltar = arrastando && braco.habilitado && !somenteLeitura;
          const sobAlvo = alvoDeSoltar && destinoAtivo === chave;
          // braço só com pesca: borda azul, pra não parecer livre
          const soPesca = !alocacao && pescasDoBraco.length > 0 && braco.habilitado;
          const borda = sobAlvo ? COR_PESCA : soPesca ? COR_PESCA : destacado ? COR_MANUAL : cores.stroke;
          const fundo = sobAlvo ? `${COR_PESCA}33` : soPesca ? `${COR_PESCA}1F` : cores.fill;

          const acionar = () => interativo && onBracoClick?.(braco, alocacao || null);

          return (
            <g
              key={chave}
              data-destino={alvoDeSoltar ? chave : undefined}
              role={interativo ? "button" : undefined}
              tabIndex={interativo ? 0 : undefined}
              aria-label={descricaoDoBraco(braco, alocacao, pescasDoBraco)}
              onClick={acionar}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  acionar();
                }
              }}
              onMouseEnter={() => setHover(chave)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setFoco(chave)}
              onBlur={() => setFoco(null)}
              style={{ cursor: interativo ? "pointer" : "default", outline: "none" }}
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                rx={6}
                strokeWidth={sobAlvo ? 2.5 : 1.5}
                strokeDasharray={alvoDeSoltar && !sobAlvo ? "4 3" : undefined}
                style={{ fill: fundo, stroke: alvoDeSoltar && !sobAlvo && !alocacao && !soPesca ? COR_PESCA : borda, transition: "stroke 150ms, fill 150ms" }}
              />
              {comFoco && (
                <rect
                  x={pos.x - 3}
                  y={pos.y - 3}
                  width={pos.w + 6}
                  height={pos.h + 6}
                  rx={8}
                  fill="none"
                  stroke={COR_MANUAL}
                  strokeWidth={2}
                />
              )}
              <text x={pos.cx} y={pos.y + 14} textAnchor="middle" fontSize="11" fontWeight="600" style={{ fill: NEUTRO_TEXTO }}>
                {braco.numero}{braco.lado}
              </text>
              {alocacao && alocacao.origem === "AUTO" ? (
                <>
                  <text x={pos.cx} y={pos.cy + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill={cores.stroke}>
                    {alocacao.totalColaboradores}
                  </text>
                  <text x={pos.cx} y={pos.cy + 23} textAnchor="middle" fontSize="9" style={{ fill: NEUTRO_TEXTO }}>
                    {alocacao.totalColaboradores === 1 ? "pessoa" : "pessoas"}
                  </text>
                </>
              ) : alocacao ? (
                <text x={pos.cx} y={pos.cy + 10} textAnchor="middle" fontSize="10" fontWeight="500" fill={cores.stroke}>
                  {alocacao.diarista ? "Diarista" : primeiroNome(alocacao.colaborador?.nomeCompleto)}
                </text>
              ) : null}
              {pescasDoBraco.length > 0 && (
                <g>
                  <title>{`Pesca: ${pescasDoBraco.map((p) => (p.diarista ? "Diarista" : p.colaborador?.nomeCompleto || p.opsId)).join(", ")}`}</title>
                  <rect x={pos.cx - 20} y={pos.y + pos.h - 17} width={40} height={14} rx={7} fill={COR_PESCA} />
                  <text x={pos.cx} y={pos.y + pos.h - 7} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FFFFFF">
                    {pescasDoBraco.length === 1 ? "Pesca" : `Pesca ${pescasDoBraco.length}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
