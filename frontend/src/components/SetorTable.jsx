import { Badge, Button } from "../components/UIComponents";

export default function SetorTable({ setores, onEdit, onDelete }) {
  if (!setores?.length) {
    return (
      <div className="p-8 text-center text-[#BFBFC3]">
        Nenhum setor cadastrado
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
              <th className="px-5 py-4 text-left font-semibold">Nome</th>
              <th className="px-5 py-4 text-left font-semibold">Descrição</th>
              <th className="px-5 py-4 text-left font-semibold">
                Colaboradores
              </th>
              <th className="px-5 py-4 text-left font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold"></th>
            </tr>
          </thead>

          <tbody>
            {setores.map((s, index) => (
              <tr
                key={s.idSetor}
                className={`
                  ${index % 2 === 0 ? "bg-[#1A1A1C]" : "bg-[#2A2A2C]"}
                  hover:bg-[#242426] transition
                `}
              >
                <td className="px-5 py-4 font-medium text-white">
                  {s.nomeSetor}
                </td>

                <td className="px-5 py-4 text-[#BFBFC3] max-w-[300px] truncate">
                  {s.descricao || "-"}
                </td>

                <td className="px-5 py-4 text-white">
                  {s.totalColaboradores ?? 0} colaboradores
                </td>

                <td className="px-5 py-4">
                  <Badge.Status variant={s.ativo ? "success" : "danger"}>
                    {s.ativo ? "Ativo" : "Inativo"}
                  </Badge.Status>
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button.Secondary size="sm" onClick={() => onEdit(s)}>
                      Editar
                    </Button.Secondary>

                    <Button.IconButton
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(s)}
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
        {setores.map((s) => (
          <div
            key={s.idSetor}
            className="bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-white font-semibold text-sm">
                  {s.nomeSetor}
                </p>

                <p className="text-xs text-[#BFBFC3] mt-1 line-clamp-2">
                  {s.descricao || "Sem descrição"}
                </p>
              </div>

              <Badge.Status variant={s.ativo ? "success" : "danger"}>
                {s.ativo ? "Ativo" : "Inativo"}
              </Badge.Status>
            </div>

            <div className="text-xs text-[#BFBFC3]">
              <span className="text-white font-medium">
                {s.totalColaboradores ?? 0}
              </span>{" "}
              colaboradores
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2F2F33]">
              <Button.Secondary size="sm" onClick={() => onEdit(s)}>
                Editar
              </Button.Secondary>

              <Button.IconButton
                size="sm"
                variant="danger"
                onClick={() => onDelete(s)}
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