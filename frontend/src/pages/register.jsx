import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      navigate("/login", {
        state: {
          success: "Conta criada com sucesso. Faça login para continuar.",
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <div className="w-full max-w-lg bg-[#1A1A1C] border border-[#3D3D40] rounded-2xl p-10 shadow-2xl">
        
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Criar conta
          </h1>
          <p className="text-sm text-[#BFBFC3]">
            Contas criadas possuem acesso limitado ao sistema
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-[#FF453A]/10 border border-[#FF453A]/40">
            <p className="text-sm text-[#FF453A] text-center">
              {error}
            </p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* NAME */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BFBFC3]" />
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full pl-12 pr-4 py-3
                rounded-xl
                bg-[#2A2A2C]
                border border-[#3D3D40]
                text-white
                placeholder:text-[#BFBFC3]
                focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          {/* EMAIL */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BFBFC3]" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full pl-12 pr-4 py-3
                rounded-xl
                bg-[#2A2A2C]
                border border-[#3D3D40]
                text-white
                placeholder:text-[#BFBFC3]
                focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BFBFC3]" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full pl-12 pr-4 py-3
                rounded-xl
                bg-[#2A2A2C]
                border border-[#3D3D40]
                text-white
                placeholder:text-[#BFBFC3]
                focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 rounded-xl
              bg-[#FA4C00] hover:bg-[#ff5c1a]
              text-white font-medium
              transition
              disabled:opacity-50
            "
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#BFBFC3]">
            Já tem uma conta?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-[#FA4C00] hover:underline cursor-pointer"
            >
              Fazer login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
