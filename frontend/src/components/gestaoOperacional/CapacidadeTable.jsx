import React from "react";

export default function CapacidadeTable({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-[#BFBFC3]">Sem dados disponíveis</div>;
  }

  // Ordenar por hora
  const dadosOrdenados = [...data].sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#2A2A2C]">
            <th className="border border-[#3A3A3C] p-3 text-left font-semibold text-white">Hora</th>
            <th className="border border-[#3A3A3C] p-3 text-right font-semibold text-white">Capacidade</th>
            <th className="border border-[#3A3A3C] p-3 text-right font-semibold text-white">Total Produção</th>
          </tr>
        </thead>
        <tbody>
          {dadosOrdenados.map((item, index) => (
            <tr key={index} className="hover:bg-[#242426]">
              <td className="border border-[#3A3A3C] p-3 text-white">{item.hora}</td>
              <td className="border border-[#3A3A3C] p-3 text-right text-white">
                {item.capacidade.toLocaleString("pt-BR")}
              </td>
              <td className="border border-[#3A3A3C] p-3 text-right font-semibold text-white">
                {index === 0 ? item.totalProducao.toLocaleString("pt-BR") : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
