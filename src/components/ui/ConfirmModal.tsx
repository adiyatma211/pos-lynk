'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success';
  itemName?: string;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  type = 'danger',
  itemName,
}: ConfirmModalProps) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="text-red-500" size={24} />,
          iconBg: 'bg-red-50',
          confirmBg: 'bg-red-500 hover:bg-red-600',
          confirmText: 'text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-yellow-500" size={24} />,
          iconBg: 'bg-yellow-50',
          confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
          confirmText: 'text-white',
        };
      case 'success':
        return {
          icon: <Check className="text-green-500" size={24} />,
          iconBg: 'bg-green-50',
          confirmBg: 'bg-green-500 hover:bg-green-600',
          confirmText: 'text-white',
        };
      default:
        return {
          icon: <AlertTriangle className="text-gray-500" size={24} />,
          iconBg: 'bg-gray-50',
          confirmBg: 'bg-gray-500 hover:bg-gray-600',
          confirmText: 'text-white',
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            backdropFilter: 'blur(0px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${typeStyles.iconBg}`}>
                {typeStyles.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-600 leading-relaxed">
              {message}
            </p>
            {itemName && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700">
                  "{itemName}"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 ${typeStyles.confirmBg} ${typeStyles.confirmText} rounded-xl font-medium transition-colors flex items-center justify-center gap-2`}
            >
              {type === 'danger' && <Trash2 size={16} />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Hook untuk replace confirm()
export const useConfirm = () => {
  const confirmModal = async ({
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    confirmText = 'Ya',
    cancelText = 'Batal',
    type = 'danger',
    itemName,
  }: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'success';
    itemName?: string;
  } = {}) => {
    return new Promise<boolean>((resolve) => {
      // Create modal container
      const modalContainer = document.createElement('div');
      document.body.appendChild(modalContainer);

      // Flag to prevent multiple resolution attempts
      let isResolved = false;

      // Import react-dom/client and render modal
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(modalContainer);

        const safeCleanup = () => {
          if (isResolved) return;
          isResolved = true;
          root.unmount();
          if (document.body.contains(modalContainer)) {
            document.body.removeChild(modalContainer);
          }
        };

        const handleClose = () => {
          safeCleanup();
          resolve(false);
        };

        const handleConfirm = () => {
          safeCleanup();
          resolve(true);
        };

        root.render(
          <ConfirmModal
            isOpen={true}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title={title}
            message={message}
            confirmText={confirmText}
            cancelText={cancelText}
            type={type}
            itemName={itemName}
          />
        );
      }).catch((error) => {
        console.error('Failed to render confirm modal:', error);
        if (!isResolved) {
          isResolved = true;
          if (document.body.contains(modalContainer)) {
            document.body.removeChild(modalContainer);
          }
        }
        resolve(false);
      });
    });
  };

  return { confirmModal };
};