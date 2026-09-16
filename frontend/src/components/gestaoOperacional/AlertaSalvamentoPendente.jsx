import { useState, useEffect } from "react";
import { AlertTriangle, Save, X } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
export default function AlertaSalvamentoPendente() {
  const [turnosPendentes, setTurnosPendentes] = useState([]);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    // Verificar status a cada 2 minutos
    verificarStatus();
    const intervalo = setInterval(verificarStatus, 120000); // 2 minutos
    
    return () => clearInterval(intervalo);
  }, []);

  const verificarStatus = async () => {
    try {
      const response = await api.get("/dashboard/gestao-operacional/status-salvamentos");
      
      if (response.data.success && response.data.temPendencias) {
        setTurnosPendentes(response.data.turnosPendentes);
        setMostrarAlerta(true);
        
        // Mostrar toast apenas se houver pendências novas
        if (response.data.turnosPendentes.length > 0) {
          toast.error(
            `⚠️ ${response.data.turnosPendentes.length} turno(s) não foram salvos automaticamente!`,
            {
              duration: 5000,
              id: "salvamento-pendente"
            }
          );
        }
      } else {
        setMostrarAlerta(false);
        setTurnosPendentes([]);
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    }
  };

  const salvarManualmente = async (turno, data) => {
    try {
      setSalvando(true);
      toast.loading(`Salvando dados do ${turno}...`, { id: `salvar-${turno}` });
      
      const response = await api.post("/dashboard/gestao-operacional/salvar-historico", {
        turno
      });
      
      if (response.data.success) {
        toast.success(
          `✅ ${response.data.message} - ${response.data.registros} registros salvos`,
          { id: `salvar-${turno}`, duration: 4000 }
        );
        
        // Remover turno da lista de pendentes
        setTurnosPendentes(prev => prev.filter(t => t.turno !== turno));
        
        // Se não houver mais pendências, ocultar alerta
        if (turnosPendentes.length === 1) {
          setMostrarAlerta(false);
        }
        
        // Verificar status novamente após 2 segundos
        setTimeout(verificarStatus, 2000);
      } else {
        toast.error(`❌ Erro: ${response.data.message}`, { id: `salvar-${turno}` });
      }
    } catch (error) {
      console.error("Erro ao salvar manualmente:", error);
      toast.error(
        `❌ Erro ao salvar ${turno}: ${error.response?.data?.message || error.message}`,
        { id: `salvar-${turno}` }
      );
    } finally {
      setSalvando(false);
    }
  };

  const fecharAlerta = () => {
    setMostrarAlerta(false);
  };

  if (!mostrarAlerta || turnosPendentes.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md animate-slide-in-right">
      <div className="bg-surface border border-red-500/30 border-l-4 border-l-red-500 rounded-xl shadow-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" aria-hidden="true" />
            <h3 className="font-semibold text-page">
              Salvamento Automático Falhou
            </h3>
          </div>
          <button
            onClick={fecharAlerta}
            aria-label="Fechar alerta"
            className="p-1 -m-1 rounded-md text-muted hover:text-page hover:bg-surface-2 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          {turnosPendentes.map((item) => (
            <div
              key={`${item.turno}-${item.data}`}
              className="bg-surface-2 rounded-lg p-3 border border-default"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="font-medium text-page">{item.turno}</p>
                  <p className="text-sm text-muted">
                    Data: {new Date(item.data).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted/80">
                    Esperado às {item.horarioEsperado}
                  </p>
                </div>
                <button
                  onClick={() => salvarManualmente(item.turno, item.data)}
                  disabled={salvando}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
              <p className="text-sm text-red-400">{item.mensagem}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-default">
          <p className="text-xs text-muted">
            Clique em "Salvar" para executar o salvamento manualmente.
          </p>
        </div>
      </div>
    </div>
  );
}
