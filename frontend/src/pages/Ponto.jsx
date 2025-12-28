import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";

function formatCPF(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11);
}

export default function PontoPage() {
  const [cpf, setCpf] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(null); // success | error
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const handleRegistrar = async () => {
    if (cpf.length !== 11 || loading) return;

    setLoading(true);
    setMsg("");
    setMsgType(null);

    try {
      const res = await api.post("/ponto/registrar", { cpf });
      setMsg(res.data.message || "Presença registrada com sucesso");
      setMsgType("success");
      setCpf("");
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
          "Erro ao registrar ponto. Procure o líder."
      );
      setMsgType("error");
    } finally {
      setLoading(false);
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
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Registrar Ponto</h1>
            <p className="text-sm text-[#BFBFC3]">
              Digite apenas seu CPF para registrar a presença
            </p>
          </div>

          {/* CARD */}
          <section className="max-w-md mx-auto bg-[#1A1A1C] border border-[#3D3D40] rounded-2xl p-6 space-y-6">
            {/* CPF */}
            <div>
              <label className="block text-xs text-[#BFBFC3] mb-1">
                CPF do colaborador
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="Somente números"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && handleRegistrar()}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-[#2A2A2C]
                  border border-[#3D3D40]
                  text-white
                  text-lg tracking-widest
                  placeholder:text-[#6F6F73]
                  focus:outline-none
                  focus:ring-1
                  focus:ring-[#FA4C00]
                "
              />
            </div>

            {/* BOTÃO */}
            <button
              onClick={handleRegistrar}
              disabled={cpf.length !== 11 || loading}
              className={`
                w-full py-3 rounded-xl
                font-semibold
                transition
                ${
                  loading || cpf.length !== 11
                    ? "bg-[#3D3D40] cursor-not-allowed"
                    : "bg-[#FA4C00] hover:bg-[#e64500] cursor-pointer"
                }
              `}
            >
              {loading ? "Registrando..." : "Registrar Presença"}
            </button>


            {/* FEEDBACK */}
            {msg && (
              <div
                className={`
                  text-center text-sm font-medium rounded-lg py-2
                  ${
                    msgType === "success"
                      ? "text-emerald-400 bg-emerald-600/10"
                      : "text-red-400 bg-red-600/10"
                  }
                `}
              >
                {msg}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
