"use client"

interface HeaderProps {
  sidebarOpen: boolean
}

export default function Header({ sidebarOpen }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 md:px-8 py-4 flex items-center justify-between">
      <div className="md:block hidden"></div>

      <div className="flex items-center gap-4 ml-auto">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-xl">🔔</button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-xl">👤</button>
      </div>
    </header>
  )
}
