import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Dropdown de seleção múltipla com checkboxes.
 *
 * @param {string} label - Texto exibido quando nada está selecionado.
 * @param {{value: string|number, label: string}[]} options
 * @param {(string|number)[]} selected - valores selecionados.
 * @param {(values: (string|number)[]) => void} onChange
 */
export default function MultiSelect({ label, options = [], selected = [], onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleValue = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const summary =
    selected.length === 0
      ? label
      : selected.length === 1
      ? options.find((o) => String(o.value) === String(selected[0]))?.label || label
      : `${label} (${selected.length})`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-surface border border-default px-4 py-2 rounded-xl text-sm text-page"
      >
        <span className={selected.length ? "text-page" : "text-muted"}>{summary}</span>
        <ChevronDown size={14} className="text-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[200px] max-h-64 overflow-y-auto scrollbar-hide bg-surface border border-default rounded-xl shadow-lg p-1">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-2 text-xs text-muted hover:bg-surface-2 rounded-lg"
            >
              Limpar seleção
            </button>
          )}

          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted">Nenhuma opção</div>
          )}

          {options.map((opt) => {
            const isChecked = selected.some((v) => String(v) === String(opt.value));
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => toggleValue(opt.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-page hover:bg-surface-2 rounded-lg text-left"
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${
                    isChecked
                      ? "bg-[#FA4C00] border-[#FA4C00]"
                      : "border-default"
                  }`}
                >
                  {isChecked && <Check size={11} className="text-white" />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
