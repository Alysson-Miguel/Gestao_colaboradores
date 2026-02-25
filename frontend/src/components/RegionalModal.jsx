import { X } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function RegionalModal({ regional, onClose, onSave }) {
  const [empresas, setEmpresas] = useState([]);

  const [form, setForm] = useState(() => ({
    nome: regional?.nome || "",
    idEmpresa: regional?.idEmpresa || "",
  }));

  /* ================= BLOQUEIA SCROLL BODY ================= */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  /* ================= LOAD EMPRESAS ================= */
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await api.get("/empresas");
        if (!active) return;
        setEmpresas(res.data.data || res.data);
      } catch (err) {
        console.error("Erro ao carregar empresas", err);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    if (!form.nome || !form.idEmpresa) return;
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 sm:px-6">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative
          w-full
          max-w-lg
          max-h-[92vh]
          bg-[#1A1A1C]
          border border-[#3D3D40]
          rounded-t-2xl sm:rounded-xl
          shadow-2xl
          flex flex-col
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3D3D40]">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            {regional ? "Editar Regional" : "Nova Regional"}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[#2A2A2C] text-[#BFBFC3]"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          <Input
            label="Nome da Regional"
            name="nome"
            value={form.nome}
            onChange={handleChange}
          />

          <Select
            label="Empresa"
            name="idEmpresa"
            value={form.idEmpresa}
            onChange={handleChange}
            options={empresas}
            labelKey="razaoSocial"
            valueKey="idEmpresa"
          />
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 py-4 border-t border-[#3D3D40]">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2A2A2C]"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#FA4C00]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= UI ================= */

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs text-[#BFBFC3]">{label}</label>
      <input
        {...props}
        className="
          w-full mt-1
          px-3 sm:px-4 py-2.5
          bg-[#2A2A2C]
          border border-[#3D3D40]
          rounded-xl
          text-white text-sm
          focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
        "
      />
    </div>
  );
}

function Select({ label, options, labelKey, valueKey, ...props }) {
  return (
    <div>
      <label className="text-xs text-[#BFBFC3]">{label}</label>
      <select
        {...props}
        className="
          w-full mt-1
          px-3 sm:px-4 py-2.5
          bg-[#2A2A2C]
          border border-[#3D3D40]
          rounded-xl
          text-white text-sm
        "
      >
        <option value="">Selecione</option>
        {options.map((o) => (
          <option key={o[valueKey]} value={o[valueKey]}>
            {o[labelKey]}
          </option>
        ))}
      </select>
    </div>
  );
}