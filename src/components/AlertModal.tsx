import { motion, AnimatePresence } from 'motion/react';
import { Package, X, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { ModalAlert } from '../types';

interface AlertModalProps {
  alert: ModalAlert | null;
  onClose: () => void;
}

export function AlertModal({ alert, onClose }: AlertModalProps) {
  if (!alert) return null;

  const handleConfirm = () => {
    if (alert.onConfirm) {
      alert.onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (alert.onCancel) {
      alert.onCancel();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="bg-white w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 text-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-inner ${
                alert.type === 'success'
                  ? 'bg-theme-light text-theme-primary'
                  : alert.type === 'error'
                  ? 'bg-red-50 text-red-600'
                  : alert.type === 'confirm'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              {alert.type === 'success' && <CheckCircle2 className="w-8 h-8" />}
              {alert.type === 'error' && <AlertCircle className="w-8 h-8" />}
              {alert.type === 'confirm' && <LogOut className="w-8 h-8" />}
              {alert.type === 'info' && <Package className="w-8 h-8" />}
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug">
              {alert.title}
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed px-2">
              {alert.message}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            {alert.type === 'confirm' && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
              >
                {alert.cancelText || 'Cancel'}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs text-white shadow-md transition-all active:scale-95 cursor-pointer ${
                alert.type === 'error'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  : alert.type === 'confirm'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                  : 'bg-theme-primary hover:bg-theme-primary-hover theme-shadow'
              }`}
            >
              {alert.confirmText || 'OK'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
