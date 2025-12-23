import { useState } from "react";
import { Button } from "../components/UIComponents";
import { X } from "lucide-react";

export default function EmpresaModal({ empresa = null, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    idEmpresa: empresa?.idEmpresa ?? null,
    razaoSocial: empresa?.razaoSocial ?? "",
    cnpj: empresa?.cnpj ?? "",
    ativo: empresa?.ativo ?? true,
  }));

  const handle = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = () => {
    if (!form.razaoSocial || !form.cnpj) return;
    onSave({ ...form, ativo: Boolean(form.ativo) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#1A1A1C] rounded-xl border border-[#3D3D40] shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3D3D40]">
          <h2 className="text-lg font-semibold text-white">
            {form.idEmpresa ? "Editar Empresa" : "Nova Empresa"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[#2A2A2C] text-[#BFBFC3]"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4">
          {form.idEmpresa && (
            <div>
              <label className="block text-xs text-[#BFBFC3] mb-1">ID</label>
              <input
                disabled
                value={form.idEmpresa}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-[#2A2A2C] border border-[#3D3D40]
                  text-[#BFBFC3]
                "
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-[#BFBFC3] mb-1">
              Razão Social
            </label>
            <input
              value={form.razaoSocial}
              onChange={(e) => handle("razaoSocial", e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg
                bg-[#2A2A2C] border border-[#3D3D40]
                text-white focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          <div>
            <label className="block text-xs text-[#BFBFC3] mb-1">CNPJ</label>
            <input
              value={form.cnpj}
              onChange={(e) => handle("cnpj", e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg
                bg-[#2A2A2C] border border-[#3D3D40]
                text-white focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          <div>
            <label className="block text-xs text-[#BFBFC3] mb-1">Status</label>
            <select
              value={form.ativo ? "true" : "false"}
              onChange={(e) => handle("ativo", e.target.value === "true")}
              className="
                w-full px-4 py-3 rounded-lg
                bg-[#2A2A2C] border border-[#3D3D40]
                text-white
              "
            >
              <option value="true">Ativa</option>
              <option value="false">Inativa</option>
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#3D3D40]">
          <Button.Secondary onClick={onClose}>Cancelar</Button.Secondary>
          <Button.Primary onClick={submit}>
            {form.idEmpresa ? "Salvar alterações" : "Criar empresa"}
          </Button.Primary>
        </div>
      </div>
    </div>
  );
}
