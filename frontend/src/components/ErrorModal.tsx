import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl p-px shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)' }}>
        <div className="rounded-2xl p-6" style={{ background: '#0d0d1a' }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <AlertCircle className="w-7 h-7" style={{ color: '#8B5CF6' }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
              Something went wrong
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;