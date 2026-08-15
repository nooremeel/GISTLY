import { useToast } from '../context/ToastContext';

const typeStyles = {
  success: { background: '#e6f4ea', color: '#1e7e34', border: '1px solid #1e7e34' },
  error:   { background: '#fdecea', color: '#c62828', border: '1px solid #c62828' },
  info:    { background: '#e8f0fe', color: '#1a56db', border: '1px solid #1a56db' },
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            minWidth: 220,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            ...(typeStyles[toast.type] || typeStyles.info),
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}