import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`bg-dark-card border border-white/5 rounded-2xl ${paddings[padding]} ${
        hover ? 'hover:border-white/10 hover:bg-dark-card-highlight transition-all duration-200' : ''
      } ${onClick ? 'cursor-pointer text-left w-full' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}
