import { Badge, Button } from "../components/UIComponents";

export default function CargoTable({ cargos, onEdit, onDelete }) {
  if (!cargos?.length) {
    return (
      <div className="p-8 text-center text-[#BFBFC3]">
        Nenhum cargo cadastrado
      </div>
    );
  }

  return (
    <div className="w-full">
      
      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto rounded-xl">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="bg-[#1A1A1C] border-b border-[#3D3D40]">
            <tr className="text-xs uppercase text-[#BFBFC3]">
              <th className="px-5 py-4 text-left font-semibold">Cargo</th>
              <th className="px-5 py-4 text-left font-semibold">Nível</th>
              <th className="px-5 py-4 text-left font-semibold">
                Colaboradores
              </th>
              <th className="px-5 py-4 text-left font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold"></th>
            </tr>
          </thead>

          <tbody>
            {cargos.map((c, index) => (
              <tr
                key={c.idCargo}
                className={`
                  ${index % 2 === 0 ? "bg-[#1A1A1C]" : "bg-[#2A2A2C]"}
                  hover:bg-[#242426] transition
                `}
              >
                <td className="px-5 py-4 text-white font-medium">
                  {c.nomeCargo}
                </td>

                <td className="px-5 py-4 text-[#BFBFC3]">
                  {c.nivel || "-"}
                </td>

                <td className="px-5 py-4 text-[#BFBFC3]">
                  {c._count?.colaboradores ?? 0}
                </td>

                <td className="px-5 py-4">
                  <Badge.Status variant={c.ativo ? "success" : "danger"}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge.Status>
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button.Secondary size="sm" onClick={() => onEdit(c)}>
                      Editar
                    </Button.Secondary>

                    <Button.IconButton
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(c)}
                    >
                      Excluir
                    </Button.IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="md:hidden space-y-4">
        {cargos.map((c) => (
          <div
            key={c.idCargo}
            className="bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-semibold text-sm">
                  {c.nomeCargo}
                </p>
                <p className="text-xs text-[#BFBFC3] mt-1">
                  Nível: {c.nivel || "-"}
                </p>
              </div>

              <Badge.Status variant={c.ativo ? "success" : "danger"}>
                {c.ativo ? "Ativo" : "Inativo"}
              </Badge.Status>
            </div>

            <div className="text-xs text-[#BFBFC3]">
              Colaboradores:{" "}
              <span className="text-white font-medium">
                {c._count?.colaboradores ?? 0}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2F2F33]">
              <Button.Secondary size="sm" onClick={() => onEdit(c)}>
                Editar
              </Button.Secondary>

              <Button.IconButton
                size="sm"
                variant="danger"
                onClick={() => onDelete(c)}
              >
                Excluir
              </Button.IconButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}