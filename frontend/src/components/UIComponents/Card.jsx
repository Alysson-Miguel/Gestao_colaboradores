import { User } from 'lucide-react';

export const Card = {
  Simple: ({ title, description }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  ),

  WithIcon: ({ title, description, icon }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
        {icon || <User className="w-6 h-6 text-white" />}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  ),

  Stat: ({ label, value, delta }) => (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-500/30">
      <p className="text-blue-100 text-sm mb-1">{label}</p>
      <p className="text-4xl font-bold text-white mb-2">{value}</p>
      <p className="text-blue-100 text-sm">{delta}</p>
    </div>
  ),
};
