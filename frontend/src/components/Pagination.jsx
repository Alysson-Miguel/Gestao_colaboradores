// src/components/Pagination.jsx
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
}) {
  const isFirst = page === 1;
  const isLast = page === totalPages;

  // Evita divisão por zero ou páginas inválidas
  const effectiveTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
      
      {/* INFO */}
      <div className="text-sm text-[#BFBFC3]">
        Total: <span className="text-white">{totalItems}</span> registros
      </div>

      {/* CONTROLES */}
      <div className="flex items-center gap-2">

        {/* PRIMEIRA */}
        <button
          disabled={isFirst}
          onClick={() => onPageChange(1)}
          className={`p-2 rounded-lg border border-[#3D3D40]
            ${isFirst ? "opacity-40 cursor-not-allowed" : "hover:bg-[#2A2A2C]"}`}
        >
          <ChevronsLeft size={16} />
        </button>

        {/* ANTERIOR */}
        <button
          disabled={isFirst}
          onClick={() => onPageChange(page - 1)}
          className={`p-2 rounded-lg border border-[#3D3D40]
            ${isFirst ? "opacity-40 cursor-not-allowed" : "hover:bg-[#2A2A2C]"}`}
        >
          <ChevronLeft size={16} />
        </button>

        {/* PAGINA ATUAL */}
        <span className="px-3 text-sm">
          Página <strong>{page}</strong> de <strong>{effectiveTotalPages}</strong>
        </span>

        {/* PRÓXIMA */}
        <button
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
          className={`p-2 rounded-lg border border-[#3D3D40]
            ${isLast ? "opacity-40 cursor-not-allowed" : "hover:bg-[#2A2A2C]"}`}
        >
          <ChevronRight size={16} />
        </button>

        {/* ÚLTIMA */}
        <button
          disabled={isLast}
          onClick={() => onPageChange(effectiveTotalPages)}
          className={`p-2 rounded-lg border border-[#3D3D40]
            ${isLast ? "opacity-40 cursor-not-allowed" : "hover:bg-[#2A2A2C]"}`}
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* LIMIT */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#BFBFC3]">Mostrar</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="
            bg-[#1A1A1C]
            border border-[#3D3D40]
            rounded-lg px-2 py-1
            outline-none
          "
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={100}>100</option>
        </select>
        <span className="text-[#BFBFC3]">por página</span>
      </div>
    </div>
  );
}