import React from 'react';

interface AlertMessageProps {
  type?: 'error' | 'success' | 'warning';
  message: string | null | undefined;
  className?: string;
}

export function AlertMessage({ type = 'error', message, className = '' }: AlertMessageProps) {
  if (!message) return null;

  const styles = {
    error: {
      color: 'text-red-500',
      icon: 'error'
    },
    success: {
      color: 'text-green-500',
      icon: 'check_circle'
    },
    warning: {
      color: 'text-yellow-500',
      icon: 'warning'
    }
  }[type];

  return (
    <div className={`${styles.color} text-sm font-medium flex items-center gap-1.5 mt-2 animate-fade-in ${className}`}>
      <span className="material-symbols-outlined text-base">{styles.icon}</span>
      <span>{message}</span>
    </div>
  );
}