import { useState, useEffect } from "react";
import { TurnosAPI } from "../services/turnos";

export function useTurnosOperacionais() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TurnosAPI.listarOperacionais()
      .then((lista) => {
        // Para ADMIN global (sem estação selecionada), a API retorna o turno
        // de cada estação separadamente — dedupe por nome, já que o filtro
        // (e as chaves de UI) trabalham por nomeTurno, não por id.
        const vistos = new Set();
        const unicos = (lista || []).filter((t) => {
          if (vistos.has(t.nomeTurno)) return false;
          vistos.add(t.nomeTurno);
          return true;
        });
        setTurnos(unicos);
      })
      .catch(() => setTurnos([]))
      .finally(() => setLoading(false));
  }, []);

  return { turnos, loading };
}
