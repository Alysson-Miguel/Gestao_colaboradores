// src/pages/empresas.jsx
import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import EmpresaModal from "../components/EmpresaModal";
import EmpresaTable from "../components/EmpresaTable";
import { EmpresasAPI } from "../services/empresas";

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const list = await EmpresasAPI.listar({
      limit: 1000,
      search: query || undefined,
    });
    setEmpresas(list);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-8 py-6 space-y-6">
          {/* HEADER */}
          <section className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Empresas</h1>
              <p className="text-sm text-[#BFBFC3]">
                Gestão de empresas, contratos e vínculos operacionais
              </p>
            </div>

            <button
              onClick={() => {
                setSelected(null);
                setModalOpen(true);
              }}
              className="
                flex items-center gap-2
                px-4 py-2 rounded-lg
                bg-[#FA4C00] hover:bg-[#e64500]
                text-white text-sm font-medium
              "
            >
              <Plus size={16} />
              Nova Empresa
            </button>
          </section>

          {/* FILTER */}
          <div className="relative w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BFBFC3]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por razão social ou CNPJ"
              className="
                w-full pl-9 pr-4 py-2.5
                rounded-lg
                bg-[#1A1A1C]
                border border-[#3D3D40]
                text-sm text-white
                placeholder:text-[#BFBFC3]
                focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          {/* TABLE */}
          <section className="bg-[#1A1A1C] rounded-xl border border-[#3D3D40] overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-[#BFBFC3]">
                Carregando empresas...
              </div>
            ) : (
              <EmpresaTable
                empresas={empresas}
                onEdit={(e) => {
                  setSelected(e);
                  setModalOpen(true);
                }}
                onDelete={async (e) => {
                  if (!window.confirm(`Excluir ${e.razaoSocial}?`)) return;
                  await EmpresasAPI.excluir(e.idEmpresa);
                  load();
                }}
              />
            )}
          </section>
        </main>
      </div>

      {modalOpen && (
        <EmpresaModal
          empresa={selected}
          onClose={() => setModalOpen(false)}
          onSave={async (data) => {
            if (selected) {
              await EmpresasAPI.atualizar(selected.idEmpresa, data);
            } else {
              await EmpresasAPI.criar(data);
            }
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
