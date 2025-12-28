export default function PresencaTooltip({ open, children }) {
  if (!open) return null;

  return (
    <div
      className="
        absolute z-50
        left-1/2 -translate-x-1/2
        top-full mt-2
        w-64
        rounded-xl
        border border-[#3D3D40]
        bg-[#121214]
        shadow-xl
        p-3
        text-xs
        text-[#EDEDED]
      "
      role="tooltip"
    >
      {/* seta */}
      <div
        className="
          absolute -top-2 left-1/2 -translate-x-1/2
          w-0 h-0
          border-l-[8px] border-l-transparent
          border-r-[8px] border-r-transparent
          border-b-[8px] border-b-[#121214]
        "
      />
      {children}
    </div>
  );
}
