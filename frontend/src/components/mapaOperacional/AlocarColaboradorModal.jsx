import { useEffect, useState } from "react";
import { User, UserPlus2 } from "lucide-react";
import toast from "react-hot-toast";
import { AbasSegmentadas, BuscaColaborador, Modal, PainelDiarista } from "./ui";
import { BTN_PERIGO } from "./uiTokens";
import { PescasDoBraco } from "./PescasDoBraco";
import { FanoutsDoBraco } from "./fanout/FanoutsDoBraco";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";

export function AlocarColaboradorModal({ esteira, braco, alocacaoAtual, pescas = [], todasPescas = [], fanouts, onClose, onAllocated }) {
  const [aba, setAba] = useState("colaborador");
  const [salvando, setSalvando] = useState(false);
  const [saldoDiarista, setSaldoDiarista] = useState(null);

  useEffect(() => {
    MapaOperacionalAPI.diaristasDisponiveis()
      .then(setSaldoDiarista)
      .catch(() => setSaldoDiarista(null));
  }, []);

  async function alocar(opsId, diarista) {
    setSalvando(true);
    try {
      await MapaOperacionalAPI.alocar(esteira.idEsteira, { braco: braco.numero, lado: braco.lado, opsId, diarista });
      toast.success(diarista ? "Diarista alocado com sucesso" : "Colaborador alocado com sucesso");
      onAllocated?.();
      onClose();
    } catch (e) {
      if (!e.tratado) toast.error(e.response?.data?.message || "Erro ao alocar");
    } finally {
      setSalvando(false);
    }
  }

  async function encerrar() {
    setSalvando(true);
    try {
      await MapaOperacionalAPI.encerrarAlocacao(esteira.idEsteira, alocacaoAtual.idAlocacao);
      toast.success("Alocação encerrada");
      onAllocated?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao encerrar alocação");
    } finally {
      setSalvando(false);
    }
  }

  const ocupante = alocacaoAtual ? (alocacaoAtual.diarista ? "Diarista" : alocacaoAtual.colaborador?.nomeCompleto || "—") : null;

  return (
    <Modal
      kicker={esteira.nome}
      titulo={`Braço ${braco.numero}${braco.lado}`}
      subtitulo={alocacaoAtual ? "Braço ocupado" : "Braço livre"}
      onClose={onClose}
      bloqueado={salvando}
    >
      {alocacaoAtual && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-default px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">Alocado agora</p>
            <p className="text-sm font-medium truncate">{ocupante}</p>
          </div>
          <button type="button" onClick={encerrar} disabled={salvando} className={`${BTN_PERIGO} h-9`}>
            Encerrar alocação
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs text-muted uppercase tracking-wide">Packing manual</h3>
        {alocacaoAtual && <p className="text-xs text-muted">Ou substituir por:</p>}
        <AbasSegmentadas
          rotulo="Tipo de alocação"
          valor={aba}
          onChange={setAba}
          opcoes={[
            { valor: "colaborador", rotulo: "Colaborador", icone: <User size={14} aria-hidden="true" /> },
            { valor: "diarista", rotulo: "Diarista", icone: <UserPlus2 size={14} aria-hidden="true" /> },
          ]}
        />

        {aba === "colaborador" ? (
          <BuscaColaborador contexto="ESTEIRA" onSelecionar={(c) => alocar(c.opsId, false)} desabilitado={salvando} />
        ) : (
          <PainelDiarista saldo={saldoDiarista} rotuloAcao="Alocar diarista neste braço" onAlocar={() => alocar(null, true)} ocupado={salvando} />
        )}
      </div>

      <FanoutsDoBraco fanouts={fanouts} braco={braco} />

      <PescasDoBraco esteira={esteira} braco={braco} pescas={pescas} todasPescas={todasPescas} editavel onChanged={onAllocated} />
    </Modal>
  );
}
