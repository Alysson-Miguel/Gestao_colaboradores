export default function TurnoSelector({ turno, onChange }) {
  return (
    <div className="flex gap-2">
      {["T1", "T2", "T3"].map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${
              turno === t
                ? "bg-[#FA4C00] text-white"
                : "bg-[#1A1A1C] text-[#BFBFC3] hover:bg-[#2A2A2C]"
            }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
