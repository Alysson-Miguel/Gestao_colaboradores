import { useState } from 'react';
import { Button, Card, Badge, Alert, Toast } from './index';
import { Plus, Download, Trash2, Edit, Check, User, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function UIComponentsGuide() {
  const [showToast, setShowToast] = useState(false);
  const [selectedTab, setSelectedTab] = useState('buttons');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🎨 Guia de Componentes UI
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Biblioteca completa de componentes do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-2 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          {['buttons', 'cards', 'badges', 'alerts', 'toast'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-2 rounded-xl font-medium transition-all capitalize ${
                selectedTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons Section */}
      {selectedTab === 'buttons' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Botões</h2>

            <div className="mb-8 flex flex-wrap gap-4">
              <Button.Primary>Primary Button</Button.Primary>
              <Button.Primary icon={<Plus className="w-5 h-5" />}>With Icon</Button.Primary>
              <Button.Primary disabled>Disabled</Button.Primary>

              <Button.Secondary>Secondary Button</Button.Secondary>
              <Button.Secondary icon={<Download className="w-5 h-5" />}>Download</Button.Secondary>

              <Button.Outline>Outline Button</Button.Outline>
              <Button.Outline>Outline Secondary</Button.Outline>

              <Button.IconButton icon={<Plus className="w-5 h-5" />} />
              <Button.IconButton icon={<Edit className="w-5 h-5" />} />
              <Button.IconButton icon={<Trash2 className="w-5 h-5" />} bg="red" />
              <Button.IconButton icon={<Check className="w-5 h-5" />} bg="green" />
            </div>
          </div>
        </div>
      )}

      {/* Cards Section */}
      {selectedTab === 'cards' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card.Simple title="Card Simples" description="Este é um card básico com conteúdo simples." />
              <Card.WithIcon
                title="Card com Ícone"
                description="Card com ícone destacado no topo."
                icon={<User className="w-6 h-6 text-white" />}
              />
              <Card.Stat label="Total de Usuários" value="1,234" delta="+12% vs. mês anterior" />
            </div>
          </div>
        </div>
      )}

      {/* Badges Section */}
      {selectedTab === 'badges' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Badges</h2>
            <div className="flex flex-wrap gap-3">
              <Badge.Status>Ativo</Badge.Status>
              <Badge.Status color="red">Inativo</Badge.Status>
              <Badge.Status color="yellow">Pendente</Badge.Status>
              <Badge.Status color="blue">Em Processo</Badge.Status>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Badge.WithIcon icon={<CheckCircle className="w-4 h-4" />} color="green">Aprovado</Badge.WithIcon>
              <Badge.WithIcon icon={<XCircle className="w-4 h-4" />} color="red">Rejeitado</Badge.WithIcon>
              <Badge.WithIcon icon={<Clock className="w-4 h-4" />} color="yellow">Aguardando</Badge.WithIcon>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {selectedTab === 'alerts' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Alerts</h2>
            <Alert type="success" title="Sucesso!" message="Operação realizada com sucesso." />
            <Alert type="error" title="Erro!" message="Ocorreu um erro ao processar sua solicitação." />
            <Alert type="warning" title="Atenção!" message="Verifique os dados antes de continuar." />
            <Alert type="info" title="Informação" message="Esta é uma mensagem informativa importante." />
          </div>
        </div>
      )}

      {/* Toast Section */}
      {selectedTab === 'toast' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Toast Notifications</h2>
            <Button.Primary
              onClick={() => {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }}
            >
              Mostrar Toast
            </Button.Primary>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && <Toast type="success" message="Operação realizada com sucesso!" onClose={() => setShowToast(false)} />}
    </div>
  );
}
