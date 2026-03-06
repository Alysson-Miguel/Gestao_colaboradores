import { useState, useEffect } from "react";
import { Calendar, Package } from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import ProducaoChart from "../../components/gestaoOperacional/ProducaoChart";
import CapacidadeTable from "../../components/gestaoOperacional/CapacidadeTable";

export default function GestaoOperacional() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [turno, setTurno] = useState("T1");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    console.log("🔄 useEffect disparado - Filtros atualizados:", { data, turno });
    carregarDados();
    
    // Atualização automática a cada 1 minuto
    const intervalo = setInterval(() => {
      console.log("⏰ Atualização automática disparada");
      carregarDados();
    }, 60000); // 60 segundos
    
    // Limpar intervalo ao desmontar ou quando filtros mudarem
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, turno]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      
      console.log("🔄 Carregando dados com filtros:", { data, turno });
      console.log("🔑 Token no localStorage:", localStorage.getItem("token") ? "Presente" : "Ausente");
      
      const response = await api.get("/dashboard/gestao-operacional", {
        params: { data, turno }
      });
      
      console.log("✅ Resposta recebida:", response.data);
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
      console.error("📋 Resposta do servidor:", error.response?.data);
      console.error("📊 Status:", error.response?.status);
      
      const mensagemErro = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Erro ao carregar dados";
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const limparCacheEAtualizar = async () => {
    try {
      setLoading(true);
      console.log("🗑️ Limpando cache...");
      
      // Limpar cache no backend
      await api.post("/cache/limpar");
      
      console.log("✅ Cache limpo, recarregando dados...");
      
      // Recarregar dados
      await carregarDados();
    } catch (error) {
      console.error("❌ Erro ao limpar cache:", error);
      // Mesmo com erro, tenta recarregar
      await carregarDados();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D0D0D] text-[#BFBFC3]">
        Carregando…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Erro</div>
          <div className="text-[#BFBFC3]">{erro}</div>
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {};

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6 xl:p-10 2xl:px-20 space-y-6 max-w-[1600px] mx-auto">
          {/* Header com Badge PACKING e Filtros */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#E8491D] px-6 py-3 rounded-lg flex items-center gap-2">
                <Package className="w-6 h-6" />
                <span className="text-xl font-bold">PACKING</span>
              </div>
              {/* Indicador de filtros ativos */}
              <div className="text-sm text-[#BFBFC3]">
                <span className="font-semibold text-white">{turno}</span> | {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botão de atualizar com cache limpo */}
              <button
                onClick={() => limparCacheEAtualizar()}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-[#5A5A5C] disabled:cursor-not-allowed cursor-pointer rounded-lg text-white text-sm font-semibold transition-colors flex items-center gap-2"
                title="Limpar cache e atualizar dados da planilha"
              >
                {loading ? "Carregando..." : "🔄 Forçar Atualização"}
              </button>
              
              {/* Filtro de Turno */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#BFBFC3]">Turno:</label>
                <select
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  className="px-4 py-2 bg-[#1A1A1C] border border-[#2A2A2C] rounded-lg text-white"
                >
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                </select>
              </div>

              {/* Filtro de Data */}
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#BFBFC3]" />
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="px-4 py-2 bg-[#1A1A1C] border border-[#2A2A2C] rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* KPIs Header - Estilo da imagem */}
          <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-lg overflow-hidden shadow-lg">
            {/* Indicador de Turno e Data */}
            <div className="bg-[#2A2A2C] px-6 py-2 text-center">
              <span className="text-sm text-[#BFBFC3]">
                Dados de: <span className="font-bold text-white">{dashboardData?.turno || turno}</span> - {dashboardData?.dataReferencia ? new Date(dashboardData.dataReferencia + 'T00:00:00').toLocaleDateString('pt-BR') : 'Carregando...'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-[#2A2A2C]">
              {/* Meta do Dia */}
              <div className="bg-[#E8491D] text-white p-6 text-center">
                <div className="text-sm font-semibold mb-2">META DO DIA</div>
                <div className="text-4xl font-bold">
                  {kpis.metaDia?.toLocaleString("pt-BR") || "0"}
                </div>
              </div>

              {/* Meta Hora Atual */}
              <div className="bg-[#E8491D] text-white p-6 text-center">
                <div className="text-sm font-semibold mb-2">
                  META HORA ATUAL {kpis.horaAtual !== undefined && `(${kpis.horaAtual}h)`}
                </div>
                <div className="text-4xl font-bold">
                  {kpis.metaHoraAtual?.toLocaleString("pt-BR") || "0"}
                </div>
              </div>

              {/* Meta de Produtividade */}
              <div className="bg-[#E8491D] text-white p-6 text-center">
                <div className="text-sm font-semibold mb-2">META DE PRODUTIVIDADE</div>
                <div className="text-4xl font-bold">
                  {kpis.produtividade?.toLocaleString("pt-BR") || "0"}
                </div>
              </div>
            </div>
          </div>

          {/* Card Principal - Performance e Gráfico */}
          <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Performance Box */}
              <div className="space-y-4">
                <div className="bg-[#1e3a5f] text-white p-4 rounded">
                  <div className="text-sm font-semibold mb-2">PEFORMANCE</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Média Hora Realizado</span>
                      <span className="text-2xl font-bold">
                        {kpis.mediaHoraRealizado?.toLocaleString("pt-BR") || "0"}
                      </span>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Produtividade</span>
                      <span className="text-2xl font-bold text-red-400">
                        {kpis.produtividade || "0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta X Realizado */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white mb-4">
                    Meta <span className="text-[#BFBFC3]">X</span>{" "}
                    <span className="text-[#E8491D]">Realizado</span>
                  </div>
                  <div className="flex gap-12 justify-center items-baseline">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-400">
                        {kpis.metaDia?.toLocaleString("pt-BR") || "0"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#E8491D]">
                        {kpis.realizado?.toLocaleString("pt-BR") || "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Círculo de Performance */}
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#2A2A2C"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="12"
                      strokeDasharray={`${(kpis.performance || 0) * 2.51} ${251.2 - (kpis.performance || 0) * 2.51}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {kpis.performance?.toFixed(2) || "0"}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Título Produção por Hora */}
            <div className="bg-[#E8491D] text-white text-center py-3 rounded-t-lg -mx-6 mb-6">
              <h2 className="text-xl font-bold">Produção por Hora</h2>
            </div>

            {/* Gráfico */}
            <ProducaoChart data={dashboardData?.producaoPorHora || []} kpis={kpis} />
          </div>

          {/* Tabela de Capacidade */}
          <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Capacidade por Hora</h2>
            <CapacidadeTable data={dashboardData?.capacidadePorHora || []} />
          </div>
        </main>
      </div>
    </div>
  );
}
