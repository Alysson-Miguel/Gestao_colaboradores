import { Button } from "../components/UIComponents";

export default function EstacaoTable({ estacoes, onEdit, onDelete }) {
  if (!estacoes?.length) {
    return (
      <div className="p-8 text-center text-[#BFBFC3]">
        Nenhuma estação cadastrada
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto rounded-xl">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-[#1A1A1C] border-b border-[#3D3D40]">
            <tr className="text-xs uppercase text-[#BFBFC3]">
              {["Estação", "Regional", "Empresas", ""].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-4 font-semibold ${
                    h === "Empresas"
                      ? "text-center"
                      : h === ""
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {estacoes.map((e, index) => (
              <tr
                key={e.idEstacao}
                className={`
                  ${index % 2 === 0 ? "bg-[#1A1A1C]" : "bg-[#2A2A2C]"}
                  hover:bg-[#242426] transition
                `}
              >
                <td className="px-5 py-4 font-medium text-white">
                  {e.nomeEstacao}
                </td>

                <td className="px-5 py-4 text-[#BFBFC3]">
                  {e.regional?.nome || "-"}
                </td>

                <td className="px-5 py-4 text-center text-white">
                  {e.empresasCount ?? 1}
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button.Secondary size="sm" onClick={() => onEdit(e)}>
                      Editar
                    </Button.Secondary>

                    <Button.IconButton
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(e)}
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
        {estacoes.map((e) => (
          <div
            key={e.idEstacao}
            className="bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-semibold text-sm">
                  {e.nomeEstacao}
                </p>

                <p className="text-xs text-[#BFBFC3] mt-1">
                  Regional: {e.regional?.nome || "-"}
                </p>
              </div>

              <div className="text-xs bg-[#2A2A2C] px-2 py-1 rounded-lg text-white">
                {e.empresasCount ?? 1} emp.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2F2F33]">
              <Button.Secondary size="sm" onClick={() => onEdit(e)}>
                Editar
              </Button.Secondary>

              <Button.IconButton
                size="sm"
                variant="danger"
                onClick={() => onDelete(e)}
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