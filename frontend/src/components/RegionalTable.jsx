import { Button } from "../components/UIComponents";

export default function RegionalTable({ regionais, onEdit, onDelete }) {
  if (!regionais?.length) {
    return (
      <div className="p-8 text-center text-[#BFBFC3]">
        Nenhuma regional cadastrada
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto rounded-xl">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-[#1A1A1C] border-b border-[#3D3D40]">
            <tr className="text-xs uppercase text-[#BFBFC3]">
              {["Regional", "Empresa", ""].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-4 font-semibold ${
                    h === "" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {regionais.map((r, index) => (
              <tr
                key={r.idRegional}
                className={`
                  ${index % 2 === 0 ? "bg-[#1A1A1C]" : "bg-[#2A2A2C]"}
                  hover:bg-[#242426] transition
                `}
              >
                <td className="px-5 py-4 font-medium text-white">
                  {r.nome}
                </td>

                <td className="px-5 py-4 text-[#BFBFC3]">
                  {r.empresa?.razaoSocial || "-"}
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button.Secondary size="sm" onClick={() => onEdit(r)}>
                      Editar
                    </Button.Secondary>

                    <Button.IconButton
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(r)}
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
        {regionais.map((r) => (
          <div
            key={r.idRegional}
            className="bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-4 space-y-3"
          >
            <div>
              <p className="text-white font-semibold text-sm">
                {r.nome}
              </p>

              <p className="text-xs text-[#BFBFC3] mt-1">
                Empresa: {r.empresa?.razaoSocial || "-"}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2F2F33]">
              <Button.Secondary size="sm" onClick={() => onEdit(r)}>
                Editar
              </Button.Secondary>

              <Button.IconButton
                size="sm"
                variant="danger"
                onClick={() => onDelete(r)}
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