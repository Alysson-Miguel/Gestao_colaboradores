import { useState, useEffect } from "react";

export default function DateFilter({ value = {}, onApply }) {
  const [local, setLocal] = useState({
    dataInicio: value.dataInicio || "",
    dataFim: value.dataFim || "",
  });

  const isSameAsApplied =
    local.dataInicio === value.dataInicio &&
    local.dataFim === value.dataFim;

  useEffect(() => {
    setLocal({
      dataInicio: value.dataInicio || "",
      dataFim: value.dataFim || "",
    });
  }, [value.dataInicio, value.dataFim]);

  function apply() {
    if (!local.dataInicio || !local.dataFim) return;
    onApply(local);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 bg-[#1A1A1C] p-4 rounded-xl">
      {/* DATA INÍCIO */}
      <div className="flex flex-col">
        <span className="text-xs text-[#BFBFC3] mb-1">
          Data início
        </span>
        <input
          type="date"
          value={local.dataInicio}
          onChange={(e) =>
            setLocal((prev) => ({
              ...prev,
              dataInicio: e.target.value,
            }))
          }
          className="bg-[#0D0D0D] text-white px-3 py-2 rounded-lg border border-[#2A2A2C]"
        />
      </div>

      <span className="text-[#BFBFC3] mb-2">→</span>

      {/* DATA FIM */}
      <div className="flex flex-col">
        <span className="text-xs text-[#BFBFC3] mb-1">
          Data fim
        </span>
        <input
          type="date"
          value={local.dataFim}
          min={local.dataInicio || undefined}
          onChange={(e) =>
            setLocal((prev) => ({
              ...prev,
              dataFim: e.target.value,
            }))
          }
          className="bg-[#0D0D0D] text-white px-3 py-2 rounded-lg border border-[#2A2A2C]"
        />
      </div>

      {/* BOTÃO APLICAR */}
      <button
        onClick={apply}
        disabled={
          !local.dataInicio ||
          !local.dataFim ||
          isSameAsApplied
        }
        className={`
          h-[42px] px-5 rounded-lg text-sm font-medium transition
          ${
            isSameAsApplied
              ? "bg-[#2A2A2C] text-[#6B6B6F] cursor-not-allowed"
              : "bg-[#FA4C00] text-white hover:bg-[#FF6A1A] active:scale-[0.97] cursor-pointer"
          }
        `}
        title={
          isSameAsApplied
            ? "Período já aplicado"
            : "Aplicar período"
        }
      >
        {isSameAsApplied ? "Aplicado" : "Aplicar"}
      </button>
    </div>
  );
}
