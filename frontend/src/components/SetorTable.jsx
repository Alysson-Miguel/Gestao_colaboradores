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
    <table className="w-full text-sm">
      <thead className="bg-[#1A1A1C] border-b border-[#3D3D40]">
        <tr className="text-xs uppercase text-[#BFBFC3]">
          <th className="px-5 py-4 text-left font-semibold">Nome</th>
          <th className="px-5 py-4 text-left font-semibold">Descrição</th>
          <th className="px-5 py-4 text-left font-semibold">Colaboradores</th>
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

            <td className="px-5 py-4 text-[#BFBFC3]">
              {s.descricao || "-"}
            </td>

            <td className="px-5 py-4 text-white">
              {s._count?.colaboradores ?? 0} colaboradores
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
  );
}
