import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../services/api";

const HORARIOS = ["05:25", "13:20", "21:00"];

export default function EditarColaborador() {
  const { opsId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nomeCompleto: "",
    cpf: "",
    email: "",
    telefone: "",
    genero: "",
    matricula: "",
    idEmpresa: "",
    idSetor: "",
    idCargo: "",
    idTurno: "",
    dataAdmissao: "",
    horarioInicioJornada: "",
    status: "ATIVO",
  });

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/colaboradores/${opsId}`);
        const c = res.data.data;

        setForm({
          nomeCompleto: c.nomeCompleto || "",
          cpf: c.cpf || "",
          email: c.email || "",
          telefone: c.telefone || "",
          genero: c.genero || "",
          matricula: c.matricula || "",
          idEmpresa: c.idEmpresa ?? "",
          idSetor: c.idSetor ?? "",
          idCargo: c.idCargo ?? "",
          idTurno: c.idTurno ?? "",
          dataAdmissao: c.dataAdmissao
            ? c.dataAdmissao.substring(0, 10)
            : "",
          horarioInicioJornada: c.horarioInicioJornada
            ? c.horarioInicioJornada.substring(11, 16)
            : "",
          status: c.status || "ATIVO",
        });
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar colaborador");
        navigate("/colaboradores");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [opsId, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    try {
      const payload = { ...form };

      // Normalização para backend
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });

      await api.put(`/colaboradores/${opsId}`, payload);
      navigate("/colaboradores");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar colaborador");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-[#BFBFC3]">
        Carregando colaborador…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 max-w-5xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/colaboradores")}
                className="p-2 rounded-lg bg-[#1A1A1C] hover:bg-[#2A2A2C]"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <h1 className="text-2xl font-semibold">
                  Editar Colaborador
                </h1>
                <p className="text-sm text-[#BFBFC3]">
                  Atualização de dados cadastrais
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FA4C00] hover:bg-[#ff5a1a] rounded-xl font-medium"
            >
              <Save size={16} />
              Salvar alterações
            </button>
          </div>

          {/* INFORMAÇÕES */}
          <Section title="Informações Básicas">
            <Input label="OPS ID" value={opsId} disabled />
            <Input
              name="nomeCompleto"
              label="Nome Completo"
              value={form.nomeCompleto}
              onChange={handleChange}
            />
            <Input
              name="cpf"
              label="CPF"
              value={form.cpf}
              onChange={handleChange}
            />
            <Input
              name="email"
              label="E-mail"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              name="telefone"
              label="Telefone"
              value={form.telefone}
              onChange={handleChange}
            />
            <Input
              name="matricula"
              label="Matrícula"
              value={form.matricula}
              onChange={handleChange}
            />

            <Select
              name="genero"
              label="Gênero"
              value={form.genero}
              onChange={handleChange}
              options={["Masculino", "Feminino"]}
            />
          </Section>

          <Section title="Jornada">
            <Input
              type="date"
              name="dataAdmissao"
              label="Data de Admissão"
              value={form.dataAdmissao}
              onChange={handleChange}
            />

            <Select
              name="horarioInicioJornada"
              label="Início da Jornada"
              value={form.horarioInicioJornada}
              onChange={handleChange}
              options={HORARIOS}
            />

            <Select
              name="status"
              label="Status"
              value={form.status}
              onChange={handleChange}
              options={["ATIVO", "INATIVO", "AFASTADO", "FERIAS"]}
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

function Select({ label, options, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#BFBFC3]">{label}</label>
      <select
        {...props}
        className="px-4 py-2.5 bg-[#2A2A2C] border border-[#3D3D40] rounded-xl outline-none focus:ring-1 focus:ring-[#FA4C00]"
      >
        <option value="">Selecione</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
