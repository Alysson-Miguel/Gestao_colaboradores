import { useEffect } from "react";
import TurnoSelector from "./TurnoSelector";
import { useTurnosOperacionais } from "../../hooks/useTurnosOperacionais";

/**
 * Seletor de turno que carrega dinamicamente apenas os turnos operacionais do banco.
 *
 * Props:
 *   value        – turno selecionado atualmente
 *   onChange     – callback(turnoNome)
 *   todosKey     – chave usada para "Todos" (default "ALL")
 *   todosLabel   – label do botão "Todos" (default "Todos")
 *   incluiTodos  – inclui a opção "Todos" (default true)
 *   onTurnosLoad – callback(turnos[]) chamado quando a lista é carregada
 */
export default function TurnoSelectorOperacional({
  value,
  onChange,
  todosKey = "ALL",
  todosLabel = "Todos",
  incluiTodos = true,
  onTurnosLoad,
}) {
  const { turnos, loading } = useTurnosOperacionais();

  useEffect(() => {
    if (!loading && onTurnosLoad) onTurnosLoad(turnos);
  }, [loading, turnos, onTurnosLoad]);

  const nomes = turnos.map((t) => t.nomeTurno);
  const options = incluiTodos ? [todosKey, ...nomes] : nomes;
  const labels = {
    [todosKey]: todosLabel,
    ...Object.fromEntries(nomes.map((n) => [n, n])),
  };

  return (
    <TurnoSelector
      value={value}
      onChange={onChange}
      options={options}
      labels={labels}
    />
  );
}
