import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import ConsultaFolgasCard from "../../components/consultaFolgas/ConsultaFolgasCard";

export default function ConsultarFolgasInterno() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-page text-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-md mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Consultar Folgas</h1>
            <p className="text-sm text-muted mt-0.5">
              Informe o CPF e o Ops ID do colaborador para ver as folgas do mês atual
            </p>
          </div>

          <div className="bg-surface rounded-2xl border border-default p-6">
            <ConsultaFolgasCard />
          </div>
        </main>
      </MainLayout>
    </div>
  );
}
