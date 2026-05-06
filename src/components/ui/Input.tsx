import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-white/5 border ${
              error
                ? 'border-red-500/50 focus:border-red-500'
                : 'border-white/10 focus:border-blue-500'
            } text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors ${
              icon ? 'pl-10' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
