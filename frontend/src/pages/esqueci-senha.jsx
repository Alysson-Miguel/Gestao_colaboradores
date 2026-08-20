import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "../services/api";

export default function EsqueciSenha() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Informe seu e-mail.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao solicitar recuperação de senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-page px-4 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #FA4C00 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md bg-surface border border-default rounded-2xl p-8 sm:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FA4C00]" />
            <h1 className="text-2xl font-bold text-page tracking-wide">
              COPEOPLE
            </h1>
          </div>
          <p className="text-sm text-muted">
            {enviado ? "Verifique seu e-mail" : "Informe seu e-mail para recuperar a senha"}
          </p>
        </div>

        {enviado ? (
          <div className="space-y-6">
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border border-[#34C759]/40 bg-[#34C759]/10">
              <CheckCircle2 size={16} className="text-[#34C759] shrink-0 mt-0.5" />
              <p className="text-sm text-[#34C759]">
                Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes. O link expira em 1 hora.
              </p>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FA4C00] hover:bg-[#ff5e1a] text-white font-medium transition cursor-pointer"
            >
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-lg border border-[#FF453A]/40 bg-[#FF453A]/10" role="alert">
                <AlertCircle size={16} className="text-[#FF453A] shrink-0 mt-0.5" />
                <p className="text-sm text-[#FF453A]">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="esqueci-email" className="text-xs font-medium text-muted">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    id="esqueci-email"
                    type="email"
                    autoComplete="email"
                    placeholder="seuemail@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="
                      w-full pl-12 pr-4 py-3
                      bg-surface-2
                      border border-default
                      rounded-xl
                      text-page
                      placeholder:text-muted
                      focus:outline-none
                      focus:ring-1 focus:ring-[#FA4C00]
                      transition-shadow
                    "
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full flex items-center justify-center gap-2
                  py-3 rounded-xl
                  bg-[#FA4C00]
                  hover:bg-[#ff5e1a]
                  text-white font-medium
                  transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                  cursor-pointer
                "
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            <button
              onClick={() => navigate("/login")}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl border border-default bg-surface hover:bg-surface-2 text-muted transition cursor-pointer"
            >
              <ArrowLeft size={18} />
              Voltar ao login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
