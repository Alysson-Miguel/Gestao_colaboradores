import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nome || !email || !senha) {
      setError("Preencha todos os campos.");
      return;
    }

    let users = JSON.parse(localStorage.getItem("users") || "[]");

    if (users.some(u => u.email === email)) {
      setError("Email já cadastrado.");
      return;
    }

    users.push({ nome, email, senha, papel: "Usuário" });
    localStorage.setItem("users", JSON.stringify(users));

    setSuccess("Cadastro realizado com sucesso! Redirecionando...");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Criar conta</h1>
        <p className="text-gray-400 text-center mb-6">Preencha os campos para se cadastrar</p>

        {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}
        {success && <p className="text-sm text-green-400 mb-4 text-center">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl placeholder-gray-300 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl placeholder-gray-300 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl placeholder-gray-300 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium"
          >
            Cadastrar
          </button>
        </form>

        <p className="text-gray-400 mt-6 text-center">
          Já tem conta?{" "}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Faça login
          </span>
        </p>
      </div>
    </div>
  );
}
