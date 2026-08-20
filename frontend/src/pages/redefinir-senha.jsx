import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "../services/api";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link inválido. Solicite uma nova recuperação de senha.");
      return;
    }

    if (!novaSenha || !confirmarSenha) {
      setError("Preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/reset-password", { token, novaSenha });
      setSucesso(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao redefinir senha");
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
            {sucesso ? "Senha redefinida" : "Escolha uma nova senha"}
          </p>
        </div>

        {sucesso ? (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border border-[#34C759]/40 bg-[#34C759]/10">
            <CheckCircle2 size={16} className="text-[#34C759] shrink-0 mt-0.5" />
            <p className="text-sm text-[#34C759]">
              Sua senha foi redefinida com sucesso. Redirecionando para o login...
            </p>
          </div>
        ) : (
          <>
            {!token && (
              <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-lg border border-[#FF453A]/40 bg-[#FF453A]/10" role="alert">
                <AlertCircle size={16} className="text-[#FF453A] shrink-0 mt-0.5" />
                <p className="text-sm text-[#FF453A]">
                  Link inválido ou incompleto. Solicite uma nova recuperação de senha na tela de login.
                </p>
              </div>
            )}

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
                <label htmlFor="nova-senha" className="text-xs font-medium text-muted">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    id="nova-senha"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="
                      w-full pl-12 pr-12 py-3
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-page transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmar-senha" className="text-xs font-medium text-muted">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    id="confirmar-senha"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
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
                disabled={loading || !token}
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
                {loading ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
