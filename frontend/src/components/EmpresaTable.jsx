import { Badge, Button } from "../components/UIComponents";

export default function EmpresaTable({ empresas, onEdit, onDelete }) {
  if (!empresas?.length) {
    return (
      <div className="p-8 text-center text-[#BFBFC3]">
        Nenhuma empresa cadastrada
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto rounded-xl">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[#1A1A1C] border-b border-[#3D3D40]">
            <tr className="text-xs uppercase text-[#BFBFC3]">
              {[
                "ID",
                "Razão Social",
                "CNPJ",
                "Colab.",
                "Contratos",
                "Status",
                "",
              ].map((h) => (
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
            {empresas.map((e, index) => (
              <tr
                key={e.idEmpresa}
                className={`
                  ${index % 2 === 0 ? "bg-[#1A1A1C]" : "bg-[#2A2A2C]"}
                  hover:bg-[#242426] transition
                `}
              >
                <td className="px-5 py-4 text-white">
                  {e.idEmpresa}
                </td>

                <td className="px-5 py-4 font-medium text-white">
                  {e.razaoSocial}
                </td>

                <td className="px-5 py-4 text-[#BFBFC3]">
                  {e.cnpj}
                </td>

                <td className="px-5 py-4 text-center text-white">
                  {e._count?.colaboradores ?? 0}
                </td>

                <td className="px-5 py-4 text-center text-white">
                  {e._count?.contratos ?? 0}
                </td>

                <td className="px-5 py-4">
                  <Badge.Status variant={e.ativo ? "success" : "danger"}>
                    {e.ativo ? "Ativa" : "Inativa"}
                  </Badge.Status>
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
        {empresas.map((e) => (
          <div
            key={e.idEmpresa}
            className="bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-semibold text-sm">
                  {e.razaoSocial}
                </p>

                <p className="text-xs text-[#BFBFC3] mt-1">
                  ID: {e.idEmpresa}
                </p>
              </div>

              <Badge.Status variant={e.ativo ? "success" : "danger"}>
                {e.ativo ? "Ativa" : "Inativa"}
              </Badge.Status>
            </div>

            <div className="text-xs text-[#BFBFC3] space-y-1">
              <p>CNPJ: {e.cnpj}</p>
              <p>
                Colaboradores:{" "}
                <span className="text-white font-medium">
                  {e._count?.colaboradores ?? 0}
                </span>
              </p>
              <p>
                Contratos:{" "}
                <span className="text-white font-medium">
                  {e._count?.contratos ?? 0}
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2F2F33]">
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