import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          borderRadius: '1rem',
          padding: '0.75rem 1rem',
        },
        className: 'sonner-toast',
      }}
    />
  );
}