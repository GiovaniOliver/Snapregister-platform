'use client';

import { useState, useCallback } from 'react';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';

export interface CopyButtonProps {
  value: string;
  label?: string;
  onCopy?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  showLabel?: boolean;
  className?: string;
}

export function CopyButton({
  value,
  label = 'Copy',
  onCopy,
  size = 'md',
  variant = 'secondary',
  showLabel = true,
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setIsAnimating(true);
      onCopy?.(value);

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);

      // Reset animation
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [value, onCopy]);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  };

  const copiedClasses = copied
    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
    : '';

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value || copied}
      className={`
        inline-flex items-center gap-2 rounded-md font-medium
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${copied ? copiedClasses : variantClasses[variant]}
        ${isAnimating ? 'scale-95' : 'scale-100'}
        ${className}
      `}
      aria-label={copied ? 'Copied!' : `Copy ${label}`}
    >
      <span
        className={`
          transition-transform duration-300 ease-in-out
          ${copied ? 'rotate-0 scale-100' : 'rotate-0 scale-100'}
        `}
      >
        {copied ? (
          <CheckIcon className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        ) : (
          <ClipboardIcon className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        )}
      </span>
      {showLabel && (
        <span className="font-medium">
          {copied ? 'Copied!' : label}
        </span>
      )}
    </button>
  );
}

export interface CopyFieldButtonProps {
  fieldLabel: string;
  value: string;
  onCopy?: (fieldLabel: string, value: string) => void;
  hint?: string;
  className?: string;
}

export function CopyFieldButton({
  fieldLabel,
  value,
  onCopy,
  hint,
  className = '',
}: CopyFieldButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.(fieldLabel, value);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [value, fieldLabel, onCopy]);

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-700">{fieldLabel}</p>
          {hint && (
            <span className="text-xs text-gray-500 italic">({hint})</span>
          )}
        </div>
        <p className="text-sm text-gray-900 truncate mt-0.5">{value || '-'}</p>
      </div>
      <CopyButton
        value={value}
        label="Copy"
        size="sm"
        variant="secondary"
        showLabel={false}
        onCopy={() => onCopy?.(fieldLabel, value)}
      />
    </div>
  );
}

export interface AnimatedCopyFeedbackProps {
  show: boolean;
  fieldName: string;
}

export function AnimatedCopyFeedback({ show, fieldName }: AnimatedCopyFeedbackProps) {
  if (!show) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3
        animate-slide-in-from-top
      `}
      role="status"
      aria-live="polite"
    >
      <CheckIcon className="h-5 w-5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Copied to clipboard!</p>
        <p className="text-sm text-green-100">{fieldName}</p>
      </div>
    </div>
  );
}
