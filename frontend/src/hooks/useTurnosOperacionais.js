import { useState, useEffect } from "react";
import { TurnosAPI } from "../services/turnos";

export function useTurnosOperacionais() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TurnosAPI.listarOperacionais()
      .then(setTurnos)
      .catch(() => setTurnos([]))
      .finally(() => setLoading(false));
  }, []);

  return { turnos, loading };
}
