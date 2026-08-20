import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /* =====================================================
     MENSAGEM DE SUCESSO VINDO DO CADASTRO
  ===================================================== */
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);

      // limpa o state sem recarregar a página
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);


  /* =====================================================
     LOGIN
  ===================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !senha) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password: senha,
      });

      const { user, token } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      login(user, token);

      // 🔥 REDIRECIONAMENTO POR ROLE
      if (user.role === "OPERACAO") {
        navigate("/ponto", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-page px-4 overflow-hidden">
      {/* GLOW DE FUNDO */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #FA4C00 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md bg-surface border border-default rounded-2xl p-8 sm:p-10 shadow-2xl">

        {/* MARCA */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FA4C00]" />
            <h1 className="text-2xl font-bold text-page tracking-wide">
              COPEOPLE
            </h1>
          </div>
          <p className="text-sm text-muted">
            Acesse sua conta para continuar
          </p>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-lg border border-[#34C759]/40 bg-[#34C759]/10">
            <CheckCircle2 size={16} className="text-[#34C759] shrink-0 mt-0.5" />
            <p className="text-sm text-[#34C759]">
              {success}
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-lg border border-[#FF453A]/40 bg-[#FF453A]/10" role="alert">
            <AlertCircle size={16} className="text-[#FF453A] shrink-0 mt-0.5" />
            <p className="text-sm text-[#FF453A]">
              {error}
            </p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* EMAIL */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-medium text-muted">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                id="login-email"
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

          {/* SENHA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-senha" className="text-xs font-medium text-muted">
                Senha
              </label>
              <button
                type="button"
                onClick={() => navigate("/esqueci-senha")}
                className="text-xs font-medium text-[#FA4C00] hover:underline cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                id="login-senha"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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

          {/* BOTÃO ENTRAR */}
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
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 border-t border-default-2" />
          <span className="text-xs text-muted">ou</span>
          <div className="flex-1 border-t border-default-2" />
        </div>

        {/* CADASTRO */}
        <button
          onClick={() => navigate("/register")}
          className="
            w-full flex items-center justify-center gap-2
            py-3 rounded-xl
            border border-default
            bg-surface
            hover:bg-surface-2
            text-muted
            transition
            cursor-pointer
          "
        >
          <UserPlus size={18} />
          Criar nova conta
        </button>
      </div>
    </div>
  );
}
