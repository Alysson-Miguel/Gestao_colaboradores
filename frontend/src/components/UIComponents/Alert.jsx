import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const Alert = ({ type = 'info', title, message }) => {
  const colors = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'blue',
  };

  const Icons = {
    success: <CheckCircle className={`w-5 h-5 text-${colors.success}-600`} />,
    error: <XCircle className={`w-5 h-5 text-${colors.error}-600`} />,
    warning: <AlertCircle className={`w-5 h-5 text-${colors.warning}-600`} />,
    info: <Info className={`w-5 h-5 text-${colors.info}-600`} />,
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-${colors[type]}-50 border border-${colors[type]}-200 rounded-xl`}
    >
      {Icons[type]}
      <div>
        <h4 className={`font-semibold text-${colors[type]}-900`}>{title}</h4>
        <p className={`text-sm text-${colors[type]}-700 mt-1`}>{message}</p>
      </div>
    </div>
  );
};
