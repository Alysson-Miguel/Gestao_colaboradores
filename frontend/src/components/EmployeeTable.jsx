import { Button, Badge } from "../components/UIComponents";

const ESCALA_STYLE = {
  A: "bg-[#1E293B] border-[#334155] text-[#E5E7EB]",
  B: "bg-[#3A2F1B] border-[#5C3B10] text-[#FFE8C7]",
  C: "bg-[#2A1E3B] border-[#443366] text-[#E9D5FF]",
};

export default function EmployeeTable({ employees = [], onView }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface">
      <table className="w-full min-w-[1000px] text-sm">
        {/* HEADER */}
        <thead>
          <tr
            className="
              bg-[#121214]
              text-xs uppercase tracking-wide
              text-textSecondary
            "
          >
            {[
              "Nome",
              "Cargo",
              "Setor",
              "Empresa",
              "Escala", // 👈 NOVA COLUNA
              "Admissão",
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

        {/* BODY */}
        <tbody>
          {employees.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-muted">
                Nenhum colaborador encontrado
              </td>
            </tr>
          )}

          {employees.map((emp, index) => {
            const status = emp.status || (emp.ativo ? "ATIVO" : "INATIVO");
            const escala = emp.escala;

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

                {/* ESCALA */}
                <td className="px-5 py-4">
                  {escala ? (
                    <span
                      title={escala.descricao}
                      className={`
                        inline-flex items-center justify-center
                        min-w-7 px-2 py-1
                        text-xs font-semibold rounded-lg border
                        ${
                          ESCALA_STYLE[escala.nomeEscala] ||
                          "bg-[#2A2A2C] border-[#3D3D40] text-white"
                        }
                      `}
                    >
                      {escala.nomeEscala}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
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
                    <Button.Secondary size="sm" onClick={() => onView(emp)}>
                      Ver Perfil
                    </Button.Secondary>
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
