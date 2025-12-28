export default function AusentesHojeTable({ ausentes }) {
  return (
    <div className="bg-[#1A1A1C] rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#2A2A2C] text-[#BFBFC3]">
          <tr>
            <th className="px-6 py-4 text-left">Colaborador</th>
            <th className="px-6 py-4 text-left">Motivo</th>
            <th className="px-6 py-4 text-left">Turno</th>
          </tr>
        </thead>
        <tbody>
          {ausentes.map((a, i) => (
            <tr key={i} className="border-t border-[#3D3D40]">
              <td className="px-6 py-4">{a.nome}</td>
              <td className="px-6 py-4 text-[#BFBFC3]">
                {a.motivo || "Sem registro"}
              </td>
              <td className="px-6 py-4 text-[#BFBFC3]">
                {a.turno || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
