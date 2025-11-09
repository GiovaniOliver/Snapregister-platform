'use client';

import { useState, useCallback, useEffect } from 'react';
import { CompactCopyDataPanel } from './CopyDataPanel';
import type { UserData, ProductData } from '@/lib/types/warranty-autofill';

export interface FloatingQuickFillWidgetProps {
  userData: UserData;
  productData: ProductData;
  onCopy?: (fieldKey: string, value: string) => void;
  defaultOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function FloatingQuickFillWidget({
  userData,
  productData,
  onCopy,
  defaultOpen = false,
  position = 'bottom-right',
  className = '',
}: FloatingQuickFillWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleMaximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  // Keyboard shortcut to toggle widget (Ctrl/Cmd + Shift + C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        className={`
          fixed ${positionClasses[position]} z-50
          bg-blue-600 text-white rounded-full shadow-lg
          w-14 h-14 flex items-center justify-center
          hover:bg-blue-700 hover:scale-110
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
        aria-label="Open Quick Fill Widget"
        title="Quick Fill (Ctrl+Shift+C)"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div
        className={`
          fixed ${positionClasses[position]} z-50
          bg-white rounded-lg shadow-lg border border-gray-200
          px-4 py-3 flex items-center gap-3
          ${className}
        `}
        style={dragPosition ? { left: dragPosition.x, top: dragPosition.y } : undefined}
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-900">Quick Fill</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMaximize}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Maximize"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50
        w-96 max-w-[calc(100vw-2rem)]
        ${className}
      `}
      style={dragPosition ? { left: dragPosition.x, top: dragPosition.y } : undefined}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-sm font-semibold text-white">Quick Fill Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="p-1 hover:bg-blue-500 rounded transition-colors"
                aria-label="Minimize"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={handleToggle}
                className="p-1 hover:bg-blue-500 rounded transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Click to copy fields to your clipboard
          </p>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <CompactCopyDataPanel
            userData={userData}
            productData={productData}
            onCopy={onCopy}
          />

          {/* Keyboard Shortcut Hint */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">Ctrl+Shift+C</kbd> to toggle</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Ready to copy
            </span>
            <a
              href="/help/quick-fill"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface QuickFillButtonProps {
  onClick?: () => void;
  label?: string;
  showKeyboardHint?: boolean;
  className?: string;
}

export function QuickFillButton({
  onClick,
  label = 'Quick Fill',
  showKeyboardHint = true,
  className = '',
}: QuickFillButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2
        bg-blue-600 text-white rounded-md text-sm font-medium
        hover:bg-blue-700 active:bg-blue-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-colors
        ${className}
      `}
      title={showKeyboardHint ? 'Quick Fill (Ctrl+Shift+C)' : undefined}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      <span>{label}</span>
      {showKeyboardHint && (
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500 border border-blue-400 rounded text-xs font-mono">
          <span>⌘</span>
          <span>⇧</span>
          <span>C</span>
        </kbd>
      )}
    </button>
  );
}
