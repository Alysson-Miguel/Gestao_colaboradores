import { useEffect, useState } from "react";
import { User, UserPlus2 } from "lucide-react";
import toast from "react-hot-toast";
import { AbasSegmentadas, BuscaColaborador, Modal, PainelDiarista } from "./ui";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";

export function AlocarFullD1Modal({ onClose, onAllocated }) {
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
      await MapaOperacionalAPI.alocarFullD1({ opsId, diarista });
      toast.success(diarista ? "Diarista adicionado ao FULL D+1" : "Colaborador adicionado ao FULL D+1");
      onAllocated?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao adicionar no FULL D+1");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      kicker="FULL D+1"
      titulo="Adicionar ao pool"
      subtitulo="Para quem trabalha no FULL D+1 sem passar pelo check-in da Workstation"
      onClose={onClose}
      bloqueado={salvando}
    >
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
        <PainelDiarista saldo={saldoDiarista} rotuloAcao="Adicionar diarista" onAlocar={() => alocar(null, true)} ocupado={salvando} />
      )}
    </Modal>
  );
}
