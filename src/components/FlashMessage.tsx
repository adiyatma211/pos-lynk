import type { FlashMessage } from '@/types/pos';

interface FlashMessageProps {
  flash: FlashMessage | null;
  onClose?: () => void;
}

const flashStyles = {
  success: "border-[#5e8c5233] bg-[#a1b98633] text-[#2f4a28]",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-[#a1b98633] bg-white/70 text-[var(--text-muted)]",
};

export function FlashMessage({ flash, onClose }: FlashMessageProps) {
  if (!flash) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${flashStyles[flash.type]}`}
    >
      <div className="flex items-center justify-between">
        <span>{flash.text}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-current/60 hover:text-current transition-colors"
            aria-label="Close notification"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Variant for inline usage (like in forms)
export function InlineFlashMessage({ flash }: { flash: FlashMessage | null }) {
  if (!flash) return null;

  const getIcon = () => {
    switch (flash.type) {
      case 'success':
        return (
          <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${flashStyles[flash.type]}`}>
      {getIcon()}
      <span>{flash.text}</span>
    </div>
  );
}