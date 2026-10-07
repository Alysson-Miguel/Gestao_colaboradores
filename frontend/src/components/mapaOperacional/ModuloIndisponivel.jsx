import { useState } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import MainLayout from "../MainLayout";
import shoppito from "../../assets/shoppito-indisponivel.png";

/** Tela das páginas da Label nas estações que ainda não têm o módulo. */
export default function ModuloIndisponivel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-page text-page overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="grid place-items-center min-h-[calc(100vh-8rem)] p-6">
          <section role="status" className="flex flex-col items-center text-center gap-6 max-w-md">
            <h1 className="text-xl sm:text-2xl font-semibold leading-snug">Este módulo não está disponível para a sua estação ainda</h1>
            <img src={shoppito} alt="" width={640} height={560} draggable={false} className="w-44 sm:w-56 h-auto select-none" />
          </section>
        </main>
      </MainLayout>
    </div>
  );
}
