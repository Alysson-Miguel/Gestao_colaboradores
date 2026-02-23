export default function TurnoSelector({
  value,
  onChange,
  options = ["ALL", "T1", "T2", "T3"],
  labels = {
    ALL: "Todos",
    T1: "T1",
    T2: "T2",
    T3: "T3",
  },
}) {
  return (
    <div
      className="
        inline-flex
        bg-[#121214]
        border border-[#2A2A2C]
        rounded-xl
        p-1
        gap-1
      "
    >
      {options.map((opt) => {
        const active = value === opt;

        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`
              px-4 py-2
              text-sm font-medium
              rounded-lg
              transition-all duration-200
              ${
                active
                  ? "bg-[#FA4C00] text-white shadow-sm"
                  : "text-[#BFBFC3] hover:text-white hover:bg-[#1A1A1C]"
              }
            `}
          >
            {labels[opt] || opt}
          </button>
        );
      })}
    </div>
  );
}