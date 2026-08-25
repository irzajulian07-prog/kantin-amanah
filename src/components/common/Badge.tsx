import React from 'react';

interface BadgeProps {
  id?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'indigo';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  id,
  variant = 'neutral',
  children,
  className = '',
  dot = false
}) => {
  const variantStyles = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    indigo: 'bg-purple-100 text-purple-700',
    neutral: 'bg-slate-100 text-slate-600'
  };

  const dotStyles = {
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
    indigo: 'bg-purple-600',
    neutral: 'bg-slate-400'
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};
