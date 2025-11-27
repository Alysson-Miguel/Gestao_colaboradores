import { Plus, Download, Trash2, Edit, Check } from 'lucide-react';

export const Button = {
  Primary: ({ children, icon, disabled, ...props }) => (
    <button
      {...props}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-medium text-white transition-all ${
        disabled
          ? 'bg-blue-600 opacity-50 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2'
      }`}
    >
      {icon && icon}
      {children}
    </button>
  ),

  Secondary: ({ children, icon, ...props }) => (
    <button
      {...props}
      className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
    >
      {icon && icon}
      {children}
    </button>
  ),

  Outline: ({ children, ...props }) => (
    <button
      {...props}
      className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-medium"
    >
      {children}
    </button>
  ),

  IconButton: ({ icon, bg = 'blue', ...props }) => (
    <button
      {...props}
      className={`p-3 rounded-xl transition-all ${
        bg === 'blue'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : bg === 'red'
          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
          : bg === 'green'
          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
    </button>
  ),
};
