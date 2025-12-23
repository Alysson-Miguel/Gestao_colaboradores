import { Button, Badge } from "../components/UIComponents";

export default function EmployeeTable({ employees = [], onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface">
      <table className="w-full min-w-[900px] text-sm">
        {/* HEADER */}
        <thead>
          <tr
            className="
              bg-[#121214]
              text-xs uppercase tracking-wide
              text-textSecondary
            "
          >
            {["Nome", "Cargo", "Setor", "Empresa", "Admissão", "Status", ""].map(
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

        {/* BODY */}
        <tbody>
          {employees.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted">
                Nenhum colaborador encontrado
              </td>
            </tr>
          )}

          {employees.map((emp, index) => {
            const status = emp.status || (emp.ativo ? "ATIVO" : "INATIVO");

            return (
              <tr
                key={emp.opsId}
                className={`
                  transition-colors
                  ${index % 2 === 0 ? "bg-surface" : "bg-[#1E1E20]"}
                  hover:bg-[#242426]
                `}
              >
                {/* NOME */}
                <td className="px-5 py-4 font-medium text-text">
                  {emp.nomeCompleto}
                </td>

                {/* CARGO */}
                <td className="px-5 py-4 text-textSecondary">
                  {emp.cargo?.nomeCargo || "-"}
                </td>

                {/* SETOR */}
                <td className="px-5 py-4 text-textSecondary">
                  {emp.setor?.nomeSetor || "-"}
                </td>

                {/* EMPRESA */}
                <td className="px-5 py-4 text-textSecondary">
                  {emp.empresa?.razaoSocial || "-"}
                </td>

                {/* ADMISSÃO */}
                <td className="px-5 py-4 text-textSecondary">
                  {emp.dataAdmissao
                    ? new Date(emp.dataAdmissao).toLocaleDateString()
                    : "-"}
                </td>

                {/* STATUS */}
                <td className="px-5 py-4">
                  <Badge.Status
                    variant={status === "ATIVO" ? "success" : "danger"}
                  >
                    {status}
                  </Badge.Status>
                </td>

                {/* AÇÕES */}
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button.Secondary
                      size="sm"
                      onClick={() => onEdit(emp)}
                    >
                      Editar
                    </Button.Secondary>

                    <Button.IconButton
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(emp)}
                    >
                      Excluir
                    </Button.IconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
