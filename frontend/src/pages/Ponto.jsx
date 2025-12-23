import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";

export default function PontoPage() {
  const [cpf, setCpf] = useState("");
  const [msg, setMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const handleRegistrar = async () => {
    if (!cpf) return;

    try {
      const res = await api.post("/ponto/registrar", { cpf });
      setMsg(res.data.message);
    } catch (err) {
      setMsg(err.response?.data?.message || "Erro ao registrar ponto");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* PAGE */}
        <main className="px-8 py-6">
          {/* PAGE HEADER */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Registrar Ponto</h1>
            <p className="text-sm text-[#BFBFC3]">
              Registro de presença e controle de jornada
            </p>
          </div>

          {/* CARD */}
          <section className="max-w-md mx-auto bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-xs text-[#BFBFC3] mb-1">
                CPF do colaborador
              </label>
              <input
                type="text"
                placeholder="Digite seu CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-[#2A2A2C]
                  border border-[#3D3D40]
                  text-white
                  placeholder:text-[#BFBFC3]
                  focus:outline-none
                  focus:ring-1
                  focus:ring-[#FA4C00]
                "
              />
            </div>

            <button
              onClick={handleRegistrar}
              className="
                w-full py-3 rounded-lg
                bg-[#FA4C00] hover:bg-[#e64500]
                text-white font-medium
                transition
              "
            >
              Registrar Presença
            </button>

            {msg && (
              <div className="pt-2 text-center text-sm text-[#BFBFC3]">
                {msg}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
