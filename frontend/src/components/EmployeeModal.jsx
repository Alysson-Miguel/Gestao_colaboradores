import { useState, useEffect } from "react";
import api from "../services/api";
import { Button } from "../components/UIComponents";

export default function EmployeeModal({ employee, onClose, onSave }) {
  const formatHorario = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const [form, setForm] = useState({
    opsId: employee?.opsId || "",
    nomeCompleto: employee?.nomeCompleto || "",
    cpf: employee?.cpf || "",
    telefone: employee?.telefone || "",
    email: employee?.email || "",
    genero: employee?.genero || "",
    matricula: employee?.matricula || "",
    dataAdmissao: employee?.dataAdmissao?.split("T")[0] || "",
    horarioInicioJornada: formatHorario(employee?.horarioInicioJornada),

    idEmpresa: employee?.empresa?.idEmpresa || "",
    idCargo: employee?.cargo?.idCargo || "",
    idSetor: employee?.setor?.idSetor || "",
    idLider: employee?.lider?.opsId || "",
    idEstacao: employee?.estacao?.idEstacao || "",
    idContrato: employee?.contrato?.idContrato || "",
    idEscala: employee?.escala?.idEscala || "",
    idTurno: employee?.turno?.idTurno || "",
    status: employee?.status || "ATIVO",
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-surface border border-border rounded-lg max-w-4xl w-full p-6 shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-semibold text-text mb-6">
          {employee ? "Editar Colaborador" : "Novo Colaborador"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["opsId", "OPS ID"],
            ["nomeCompleto", "Nome Completo"],
            ["cpf", "CPF"],
            ["telefone", "Telefone"],
            ["email", "E-mail"],
            ["genero", "Gênero"],
            ["matricula", "Matrícula"],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="block text-sm text-muted mb-1">{label}</label>
              <input
                value={form[field]}
                onChange={(e) => update(field, e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surfaceHover border border-border text-text"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button.Secondary onClick={onClose}>
            Cancelar
          </Button.Secondary>

          <Button.Primary onClick={() => onSave(form)}>
            Salvar
          </Button.Primary>
        </div>
      </div>
    </div>
  );
}
