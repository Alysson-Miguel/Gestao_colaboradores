import { Search } from "lucide-react";

export default function PresencaToolbar({
  mes,
  turno,
  escala,
  busca,
  lider,
  lideres = [],
  pendenciaSaida,
  onPendenciaSaidaChange,
  onMesChange,
  onTurnoChange,
  onEscalaChange,
  onBuscaChange,
  onLiderChange,
}) {
  const turnos = ["TODOS", "T1", "T2", "T3"];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-3">
        {/* MÊS */}
        <input
          type="month"
          value={mes}
          onChange={(e) => onMesChange(e.target.value)}
          className="
            bg-[#1A1A1C]
            text-sm
            px-4 py-2
            rounded-xl
            text-[#BFBFC3]
            outline-none
            hover:bg-[#2A2A2C]
          "
        />

        {/* TURNO */}
        <select
          value={turno}
          onChange={(e) => onTurnoChange(e.target.value)}
          className="
            bg-[#1A1A1C]
            text-sm
            px-4 py-2
            rounded-xl
            text-[#BFBFC3]
            outline-none
            hover:bg-[#2A2A2C]
          "
        >
          {turnos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* ESCALA */}
        <select
          value={escala}
          onChange={(e) => onEscalaChange(e.target.value)}
          className="
            bg-[#1A1A1C]
            text-sm
            px-4 py-2
            rounded-xl
            text-[#BFBFC3]
            outline-none
            hover:bg-[#2A2A2C]
          "
        >
          <option value="TODOS">Escala • Todas</option>
          <option value="A">Escala A</option>
          <option value="B">Escala B</option>
          <option value="C">Escala C</option>
        </select>

        {/* LÍDER */}
        <select
          value={lider}
          onChange={(e) => onLiderChange(e.target.value)}
          className="
            bg-[#1A1A1C]
            text-sm
            px-4 py-2
            rounded-xl
            text-[#BFBFC3]
            outline-none
            hover:bg-[#2A2A2C]
          "
        >
          <option value="TODOS">Líder • Todos</option>
          {lideres.map((l) => (
            <option key={l.opsId} value={l.opsId}>
              {l.nomeCompleto}
            </option>
          ))}
        </select>

        {/* PENDÊNCIA DE SAÍDA */}
        <label className="
          flex items-center gap-2
          text-sm text-[#BFBFC3]
          px-3 py-2
          rounded-xl
          bg-[#1A1A1C]
          hover:bg-[#2A2A2C]
          cursor-pointer
        ">
          <input
            type="checkbox"
            checked={!!pendenciaSaida}
            onChange={(e) => onPendenciaSaidaChange(e.target.checked)}
            className="accent-[#FA4C00]"
          />
          Entrada sem saída
        </label>
      </div>

      {/* BUSCA */}
      <div className="flex items-center gap-2 bg-[#1A1A1C] px-4 py-2 rounded-xl">
        <Search size={16} className="text-[#BFBFC3]" />
        <input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar colaborador..."
          className="
            bg-transparent
            outline-none
            text-sm
            text-white
            placeholder-[#BFBFC3]
          "
        />
      </div>
    </div>
  );
}
