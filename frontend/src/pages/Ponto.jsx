import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";

function formatCPF(value) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export default function PontoPage() {
  const [cpf, setCpf] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(null); // success | error
  const [tipoBatida, setTipoBatida] = useState(null); // ENTRADA | SAIDA
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const handleRegistrar = async () => {
    if (cpf.length !== 11 || loading) return;

    setLoading(true);
    setMsg("");
    setMsgType(null);
    setTipoBatida(null);

    try {
      const res = await api.post("/ponto/registrar", { cpf });

      setMsg(res.data.message || "Ponto registrado com sucesso");
      setMsgType("success");
      setTipoBatida(res.data.tipo || null);
      setCpf("");
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
          "Erro ao registrar ponto. Procure o líder."
      );
      setMsgType("error");
      setTipoBatida(null);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     AUTO LIMPAR FEEDBACK
  ========================================== */
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => {
      setMsg("");
      setTipoBatida(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [msg]);

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
          {/* HEADER */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Registrar Ponto</h1>
            <p className="text-sm text-[#BFBFC3]">
              Digite apenas seu CPF para registrar entrada ou saída
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
                w-full py-3 rounded-xl font-semibold transition
                ${
                  loading || cpf.length !== 11
                    ? "bg-[#3D3D40] cursor-not-allowed"
                    : "bg-[#FA4C00] hover:bg-[#e64500]"
                }
              `}
            >
              {loading ? "Registrando..." : "Registrar Ponto"}
            </button>

            {/* FEEDBACK */}
            {msg && (
              <div
                className={`
                  flex items-center justify-center gap-2
                  text-sm font-medium rounded-xl py-3 px-4
                  ${
                    msgType === "success"
                      ? tipoBatida === "ENTRADA"
                        ? "text-emerald-400 bg-emerald-600/10 border border-emerald-600/20"
                        : "text-sky-400 bg-sky-600/10 border border-sky-600/20"
                      : "text-red-400 bg-red-600/10 border border-red-600/20"
                  }
                `}
              >
                {msgType === "success" && tipoBatida === "ENTRADA" && <span>🟢</span>}
                {msgType === "success" && tipoBatida === "SAIDA" && <span>🔵</span>}
                {msgType === "error" && <span>🔴</span>}
                <span>{msg}</span>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
