import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const DrawerPanel: React.FC<DrawerPanelProps> = ({ isOpen, onClose, title, subtitle, children, footer }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trapping
  useEffect(() => {
    if (isOpen) {
      const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select'
      );
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        };
        const currentPanel = panelRef.current;
        currentPanel?.addEventListener('keydown', handleTabKey);
        firstElement.focus();
        return () => currentPanel?.removeEventListener('keydown', handleTabKey);
      }
    }
  }, [isOpen]);
  
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 pt-16 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 'clamp(320px, 20vw, 480px)' }}
      >
        {/* Header */}
        <header className="flex-shrink-0 flex items-start justify-between p-4 border-b">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Close panel">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer className="flex-shrink-0 p-4 border-t bg-gray-50">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default DrawerPanel;