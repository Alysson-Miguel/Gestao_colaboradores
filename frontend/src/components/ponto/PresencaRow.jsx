import PresencaCell from "./PresencaCell";

export default function PresencaRow({
  colaborador,
  dias,
  canEdit,
  onEditCell,
}) {
  return (
    <tr className="border-t border-[#2A2A2C]">
      {/* COLABORADOR */}
      <td className="sticky left-0 bg-[#1A1A1C] z-10 px-4 py-3 border-r border-[#2A2A2C] whitespace-nowrap">
        <div className="font-medium">{colaborador.nome}</div>
        <div className="text-xs text-[#BFBFC3]">
          {colaborador.turno} • {colaborador.escala}
        </div>
      </td>

      {/* DIAS */}
      {dias.map((dia) => {
        // 🔑 monta data ISO corretamente
        const dataISO = `${colaborador.ano}-${String(colaborador.mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const registro = colaborador.dias[dataISO];

        return (
          <PresencaCell
            key={`${colaborador.opsId}-${dataISO}`} // ✅ key correta
            dia={{
              date: dataISO,
              label: `${dia}`,
            }}
            registro={registro}
            colaborador={colaborador}
            canEdit={canEdit}
            onEdit={onEditCell}
          />
        );
      })}
    </tr>
  );
}
