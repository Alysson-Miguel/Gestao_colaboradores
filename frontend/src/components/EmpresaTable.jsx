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
    <table className="w-full text-sm">
      <thead className="bg-[#1A1A1C] border-b border-[#3D3D40]">
        <tr className="text-xs uppercase text-[#BFBFC3]">
          {["ID", "Razão Social", "CNPJ", "Colab.", "Contratos", "Status", ""].map(
            (h) => (
              <th
                key={h}
                className={`px-5 py-4 font-semibold ${
                  h === "" ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            )
          )}
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
            <td className="px-5 py-4 text-white">{e.idEmpresa}</td>
            <td className="px-5 py-4 font-medium text-white">
              {e.razaoSocial}
            </td>
            <td className="px-5 py-4 text-[#BFBFC3]">{e.cnpj}</td>
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
  );
}
