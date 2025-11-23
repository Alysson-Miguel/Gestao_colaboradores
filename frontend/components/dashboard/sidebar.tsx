"use client"

import Link from "next/link"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const menuItems = [
  { emoji: "📊", label: "Dashboard", href: "/dashboard" },
  { emoji: "👨‍💼", label: "Funcionários", href: "/employees" },
  { emoji: "⏰", label: "ABS", href: "/employees/absences" },
  { emoji: "📋", label: "Ocorrências", href: "/dashboard/occurrences" },
  { emoji: "📈", label: "Relatórios", href: "/dashboard/reports" },
  { emoji: "⚙️", label: "Configurações", href: "/dashboard/settings" },
]

export default function Sidebar({ open, setOpen }: SidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${
          open ? "w-64" : "w-0"
        } bg-white transition-all duration-300 ease-in-out border-r border-gray-200 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold" style={{ color: "#FF9966" }}>
            SPX
          </h1>
          <p className="text-sm" style={{ color: "#666666" }}>
            Controle de Funcionários
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: "#666666" }}
            >
              <span className="text-xl">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ backgroundColor: "#FF9966", color: "white" }}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Mobile Overlay */}
      {open && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}
    </>
  )
}
