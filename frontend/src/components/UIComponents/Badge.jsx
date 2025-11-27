import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const Badge = {
  Status: ({ children, color = 'green' }) => (
    <span
      className={`px-3 py-1 rounded-lg text-sm font-medium ${
        color === 'green'
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : color === 'red'
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          : color === 'yellow'
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      }`}
    >
      {children}
    </span>
  ),

  WithIcon: ({ children, color = 'green', icon }) => (
    <span
      className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 ${
        color === 'green'
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : color === 'red'
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      }`}
    >
      {icon}
      {children}
    </span>
  ),
};
