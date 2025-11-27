import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ type = 'success', message, onClose }) => (
  <div
    className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
      type === 'success'
        ? 'bg-green-50 border-green-200 text-green-900'
        : type === 'error'
        ? 'bg-red-50 border-red-200 text-red-900'
        : type === 'warning'
        ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
        : 'bg-blue-50 border-blue-200 text-blue-900'
    }`}
  >
    {type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
    {type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
    {type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
    {type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-4">
      <X className="w-4 h-4" />
    </button>
  </div>
);
