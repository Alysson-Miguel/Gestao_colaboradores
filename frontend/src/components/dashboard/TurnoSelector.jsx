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
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${
              value === opt
                ? "bg-[#FA4C00] text-white"
                : "bg-[#1A1A1C] text-[#BFBFC3] hover:bg-[#2A2A2C]"
            }`}
        >
          {labels[opt] || opt}
        </button>
      ))}
    </div>
  );
}
