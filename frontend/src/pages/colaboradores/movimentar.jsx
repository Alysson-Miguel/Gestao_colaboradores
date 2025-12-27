import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../services/api";

export default function MovimentarColaborador() {
  const { opsId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    idEmpresa: "",
    idSetor: "",
    idCargo: "",
    idTurno: "",
    idLider: "",
    dataEfetivacao: "",
    motivo: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    if (!form.dataEfetivacao || !form.motivo) {
      alert("Informe a data efetiva e o motivo.");
      return;
    }

    try {
      await api.post(`/colaboradores/${opsId}/movimentar`, form);
      navigate(`/colaboradores/${opsId}/editar`);
    } catch (err) {
      console.error(err);
      alert("Erro ao realizar movimentação");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 max-w-5xl mx-auto space-y-8">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-[#1A1A1C] hover:bg-[#2A2A2C]"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <h1 className="text-2xl font-semibold">Movimentar Colaborador</h1>
                <p className="text-sm text-[#BFBFC3]">
                  Alteração organizacional com histórico
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FA4C00] hover:bg-[#ff5a1a] rounded-xl font-medium"
            >
              <Save size={16} />
              Confirmar movimentação
            </button>
          </div>

          <Section title="Novo Vínculo Organizacional">
            <Input name="idEmpresa" label="Empresa" onChange={handleChange} />
            <Input name="idSetor" label="Setor" onChange={handleChange} />
            <Input name="idCargo" label="Cargo" onChange={handleChange} />
            <Input name="idTurno" label="Turno" onChange={handleChange} />
            <Input name="idLider" label="Líder (OPS ID)" onChange={handleChange} />
          </Section>

          <Section title="Detalhes da Movimentação">
            <Input
              type="date"
              name="dataEfetivacao"
              label="Data efetiva"
              onChange={handleChange}
            />
            <Textarea
              name="motivo"
              label="Motivo da movimentação"
              onChange={handleChange}
            />
          </Section>

        </main>
      </div>
    </div>
  );
}

/* ================= COMPONENTES ================= */

function Section({ title, children }) {
  return (
    <div className="bg-[#1A1A1C] border border-[#3D3D40] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-[#BFBFC3] mb-6 uppercase">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#BFBFC3]">{label}</label>
      <input
        {...props}
        className="px-4 py-2.5 bg-[#2A2A2C] border border-[#3D3D40] rounded-xl outline-none focus:ring-1 focus:ring-[#FA4C00]"
      />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1 md:col-span-2">
      <label className="text-xs text-[#BFBFC3]">{label}</label>
      <textarea
        {...props}
        rows={4}
        className="px-4 py-3 bg-[#2A2A2C] border border-[#3D3D40] rounded-xl outline-none focus:ring-1 focus:ring-[#FA4C00]"
      />
    </div>
  );
}
