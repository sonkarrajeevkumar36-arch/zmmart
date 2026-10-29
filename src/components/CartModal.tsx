import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShoppingCart,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CreditCard,
  Banknote,
  ShieldCheck,
  Lock,
  Zap,
  QrCode,
  Copy,
  Check,
  Smartphone
} from 'lucide-react';
import { CartItem, Language } from '../types';
import { getTranslation } from '../translations';

interface CartModalProps {
  isOpen: boolean;
  cart: CartItem[];
  lang: Language;
  deliveryCharge: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'online' | 'cod' | 'upi_qr';
  upiTransactionId?: string;
  storeUpiId?: string;
  storeUpiName?: string;
  enableCod?: boolean;
  enableOnline?: boolean;
  enableUpiQr?: boolean;
  isPlacingOrder?: boolean;
  onCustomerNameChange: (val: string) => void;
  onCustomerPhoneChange: (val: string) => void;
  onCustomerAddressChange: (val: string) => void;
  onPaymentMethodChange: (method: 'online' | 'cod' | 'upi_qr') => void;
  onUpiTransactionIdChange?: (val: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onClose: () => void;
  onPlaceOrder: () => void;
}

export function CartModal({
  isOpen,
  cart,
  lang,
  deliveryCharge,
  customerName,
  customerPhone,
  customerAddress,
  paymentMethod = 'cod',
  upiTransactionId = '',
  storeUpiId = '8090315246@upi',
  storeUpiName = 'Zypsomart',
  enableCod = true,
  enableOnline = true,
  enableUpiQr = true,
  isPlacingOrder = false,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCustomerAddressChange,
  onPaymentMethodChange,
  onUpiTransactionIdChange,
  onUpdateQty,
  onClose,
  onPlaceOrder
}: CartModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  if (!isOpen) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  const itemTotal = cart.reduce((sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.qty) || 0), 0);
  const isFreeDelivery = itemTotal > 100;
  const appliedDeliveryCharge = cart.length > 0 && !isFreeDelivery ? (Number(deliveryCharge) || 0) : 0;
  const grandTotal = itemTotal + appliedDeliveryCharge;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[180] flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[88vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden text-slate-900 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                {t('myCart')}
              </h2>
              <span className="bg-green-100 text-green-800 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                {cart.length} {t('items')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar py-4 space-y-5">
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600 shadow-inner">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">
                  {t('cartLonely')}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs mb-6">
                  {t('cartLonelySub')}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all cursor-pointer"
                >
                  {t('startShopping')}
                </button>
              </motion.div>
            ) : (
              <>
                {/* List of items */}
                <div className="space-y-2.5">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100"
                    >
                      <div className="w-14 h-14 bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-slate-100">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-[11px] font-black text-green-700 mt-0.5">
                          ₹{item.price}{' '}
                          <span className="text-slate-400 font-normal text-[9px]">
                            / {lang === 'hi' && item.unit ? t(`units.${item.unit.toLowerCase()}`) || item.unit : item.unit}
                          </span>
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-slate-400 hover:text-red-500 rounded-lg text-xs"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-slate-400 hover:text-green-600 rounded-lg text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Information Section */}
                <div className="pt-2 space-y-3">
                  <h3 className="font-black text-xs text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
                    {t('deliveryDetails')}
                  </h3>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder={t('fullName')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      value={customerName}
                      onChange={(e) => onCustomerNameChange(e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder={t('phone')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      value={customerPhone}
                      onChange={(e) => onCustomerPhoneChange(e.target.value)}
                    />
                    <textarea
                      placeholder={t('address')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all min-h-[70px] resize-none"
                      value={customerAddress}
                      onChange={(e) => onCustomerAddressChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="pt-2 space-y-3">
                  <h3 className="font-black text-xs text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider flex items-center justify-between">
                    <span>{t('paymentMethod')}</span>
                    <span className="text-[10px] text-green-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Safe Payments
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. Official Razorpay Online Gateway (UPI, Cards, NetBanking) */}
                    {enableOnline && (
                      <button
                        type="button"
                        onClick={() => onPaymentMethodChange('online')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                          paymentMethod === 'online'
                            ? 'border-green-600 bg-green-50/80 shadow-xs ring-2 ring-green-500/25'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'online' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900 block leading-tight">
                                {lang === 'hi' ? 'ऑनलाइन भुगतान (UPI / QR / कार्ड्स)' : 'Pay Online (UPI / QR / Cards)'}
                              </span>
                              <span className="text-[10px] font-bold text-green-700">
                                UPI • Dynamic QR • Cards • NetBanking
                              </span>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'online' ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300'}`}>
                            {paymentMethod === 'online' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
                          <Lock className="w-3 h-3 text-green-600 shrink-0" />
                          <span className="truncate">GPay • PhonePe • QR Code • Cards</span>
                        </div>
                      </button>
                    )}

                    {/* 2. Cash on Delivery (COD) */}
                    {enableCod && (
                      <button
                        type="button"
                        onClick={() => onPaymentMethodChange('cod')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                          paymentMethod === 'cod'
                            ? 'border-green-600 bg-green-50/80 shadow-xs ring-2 ring-green-500/25'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Banknote className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900 block leading-tight">
                                {lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {lang === 'hi' ? 'घर पहुंचने पर दें (COD)' : 'Pay at Doorstep'}
                              </span>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300'}`}>
                            {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
                          {lang === 'hi' ? 'सामान मिलने पर नकद या UPI दें' : 'Cash or UPI upon delivery'}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer / Summary */}
          {cart.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-3 mt-auto">
              {/* Free delivery notification */}
              {itemTotal > 0 && itemTotal <= 100 && (
                <div className="bg-green-50 p-2.5 rounded-xl text-[11px] font-bold text-green-800 flex items-center justify-between border border-green-100">
                  <span>{t('addMore', { val: 101 - itemTotal })}</span>
                  <div className="w-16 h-1.5 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all duration-300"
                      style={{ width: `${(itemTotal / 100) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {isFreeDelivery && (
                <div className="bg-green-500/10 border border-green-500/20 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-[10px] font-black text-green-700 uppercase">
                        {t('yayFree')}
                      </p>
                      <p className="text-[9px] text-green-600">
                        {t('savedText', { val: deliveryCharge })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Details */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span>{t('itemTotal')}</span>
                  <span className="font-bold text-slate-900">₹{itemTotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('deliveryCharge')}</span>
                  <span className="font-bold">
                    {isFreeDelivery ? (
                      <span className="text-green-600">{t('free')}</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-dashed border-slate-200">
                  <span>{t('grandTotal')}</span>
                  <span className="text-green-700 font-extrabold text-base">₹{grandTotal}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="button"
                disabled={isPlacingOrder}
                onClick={onPlaceOrder}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed py-3.5 rounded-2xl text-white font-black transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                {isPlacingOrder ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {paymentMethod === 'online'
                        ? (lang === 'hi' ? 'भुगतान विंडो खुल रही है...' : 'Opening Payment Gateway...')
                        : (lang === 'hi' ? 'ऑर्डर प्रोसेस हो रहा है...' : 'Placing Order...')}
                    </span>
                  </>
                ) : (
                  <>
                    {paymentMethod === 'online' ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>{lang === 'hi' ? `Razorpay से सुरक्षित भुगतान करें (₹${grandTotal})` : `Pay ₹${grandTotal} with Razorpay`}</span>
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        <span>{t('placeCodOrder')}</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
