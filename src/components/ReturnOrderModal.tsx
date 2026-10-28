import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Package, AlertCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, getFriendlyErrorMessage } from '../firebase';
import { Order, Language } from '../types';
import { getTranslation } from '../translations';

interface ReturnOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  onError: (errMsg: string) => void;
}

export function ReturnOrderModal({
  order,
  isOpen,
  lang,
  onClose,
  onSuccess,
  onError
}: ReturnOrderModalProps) {
  const [reasonKey, setReasonKey] = useState<string>('damaged');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  const reasons = [
    { key: 'damaged', label: t('returnReasons.damaged') },
    { key: 'quality', label: t('returnReasons.quality') },
    { key: 'wrong_item', label: t('returnReasons.wrong_item') },
    { key: 'expired', label: t('returnReasons.expired') },
    { key: 'missing', label: t('returnReasons.missing') },
    { key: 'other', label: t('returnReasons.other') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!auth.currentUser) {
      onError(lang === 'hi' ? 'कृपया वापसी का अनुरोध करने के लिए पहले लॉगिन करें।' : 'Please sign in first to request an order return.');
      return;
    }

    if (!order?.id || !order?.userId) {
      onError(lang === 'hi' ? 'अमान्य ऑर्डर विवरण।' : 'Invalid order details.');
      return;
    }

    if (order.userId !== auth.currentUser.uid) {
      onError(lang === 'hi' ? 'आप केवल अपने स्वयं के ऑर्डर वापस कर सकते हैं।' : 'You can only request returns for your own orders.');
      return;
    }

    const normStatus = (order.status || '').toLowerCase().trim();
    if (normStatus !== 'delivered') {
      onError(lang === 'hi' ? 'केवल डिलीवर किए गए ऑर्डर ही वापस किए जा सकते हैं।' : 'Only delivered orders can be returned.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedReasonObj = reasons.find((r) => r.key === reasonKey);
      const returnReasonLabel = selectedReasonObj ? selectedReasonObj.label : reasonKey;

      const orderRef = doc(db, 'orders', order.id);
      const returnPayload = {
        returnReason: returnReasonLabel,
        returnReasonKey: reasonKey,
        returnNotes: notes.trim(),
        returnRequestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      try {
        await updateDoc(orderRef, {
          ...returnPayload,
          status: 'return_requested'
        });
      } catch (primaryErr: any) {
        if (primaryErr?.code === 'permission-denied') {
          // Fallback for cloud rules if they have not yet been updated from return_pending
          await updateDoc(orderRef, {
            ...returnPayload,
            status: 'return_pending',
            requestedStatus: 'return_requested'
          });
        } else {
          throw primaryErr;
        }
      }

      setIsSubmitting(false);
      onSuccess(order.id);
      onClose();
    } catch (err: any) {
      console.error('[Return Order Error]:', err);
      setIsSubmitting(false);
      const friendlyError = getFriendlyErrorMessage(err);
      onError(friendlyError);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {t('returnOrderTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'hi' ? 'ऑर्डर' : 'Order'} #{order.id.slice(-6).toUpperCase()} • ₹{order.total}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overscroll-contain space-y-5 flex-1 hide-scrollbar">
            {/* Order Items Preview */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {t('items')} ({(order.items || []).length})
                </span>
                <span className="text-xs font-black text-slate-800">
                  ₹{Number(order.total) || 0}
                </span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-medium text-slate-600">
                    <span className="truncate pr-2">{item?.name || 'Item'} × {item?.qty || 1}</span>
                    <span className="font-semibold text-slate-800 shrink-0">₹{(Number(item?.price) || 0) * (Number(item?.qty) || 1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Reason */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-800 block">
                {t('selectReturnReason')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {reasons.map((r) => (
                  <label
                    key={r.key}
                    onClick={() => setReasonKey(r.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      reasonKey === r.key
                        ? 'border-green-500 bg-green-50/70 text-green-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={r.key}
                      checked={reasonKey === r.key}
                      onChange={() => setReasonKey(r.key)}
                      className="accent-green-600 w-4 h-4"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Remarks */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 block">
                {t('additionalNotes')}
              </label>
              <textarea
                placeholder={t('additionalNotesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
              />
            </div>

            {/* Pickup Notice */}
            <div className="bg-blue-50/80 border border-blue-100 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                {lang === 'hi'
                  ? 'पिकअप एजेंट आपके दिए गए पते पर आकर आइटम कलेक्ट करेगा। वापसी स्वीकृत होने पर राशि आपके खाते में रिफंड कर दी जाएगी।'
                  : 'Our delivery associate will collect the item(s) from your delivery address. Refund will be initiated upon pickup verification.'}
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-2 py-3.5 rounded-xl font-black text-xs text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('submitting')}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('submitReturn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
