interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, message, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl p-px shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)' }}>
        <div className="rounded-2xl p-6" style={{ background: '#0d0d1a' }}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <svg className="w-7 h-7" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Success!</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{message}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)' }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}