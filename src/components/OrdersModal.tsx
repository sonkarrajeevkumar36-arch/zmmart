import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Package,
  PackageOpen,
  RotateCcw,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  ShoppingBag,
  Sparkles,
  Truck,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ShoppingBasket
} from 'lucide-react';
import { Order, Language } from '../types';
import { getTranslation } from '../translations';

interface OrdersModalProps {
  isOpen: boolean;
  orders: Order[];
  lang: Language;
  onClose: () => void;
  onCancelOrder: (orderId: string) => void;
  onRequestReturn: (order: Order) => void;
  onReorder: (order: Order) => void;
  onSelectCategory?: (category: string) => void;
  isLoggedIn?: boolean;
  onOpenAuth?: () => void;
}

export function OrdersModal({
  isOpen,
  orders,
  lang,
  onClose,
  onCancelOrder,
  onRequestReturn,
  onReorder,
  onSelectCategory,
  isLoggedIn,
  onOpenAuth
}: OrdersModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');

  if (!isOpen) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  const handleStartShopping = (categoryName?: string) => {
    if (categoryName && onSelectCategory) {
      onSelectCategory(categoryName);
    }
    onClose();
    setTimeout(() => {
      const section = document.getElementById('products-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleCopyOrderId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'placed').toLowerCase().trim();
    switch (s) {
      case 'delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          text: t('statusText.delivered') || (lang === 'hi' ? 'डिलीवर हो गया' : 'Delivered')
        };
      case 'placed':
      case 'pending':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500 animate-pulse',
          text: t('statusText.placed') || (lang === 'hi' ? 'ऑर्डर प्राप्त हुआ' : 'Order Placed')
        };
      case 'preparing':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
          text: t('statusText.preparing') || (lang === 'hi' ? 'पैकिंग हो रही है' : 'Preparing')
        };
      case 'out for delivery':
      case 'out_for_delivery':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500 animate-ping',
          text: t('statusText.out_for_delivery') || (lang === 'hi' ? 'डिलीवरी के लिए निकला' : 'Out for Delivery')
        };
      case 'return_requested':
      case 'return_pending':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-500',
          text: t('statusText.return_requested') || (lang === 'hi' ? 'वापसी अनुरोध' : 'Return Requested')
        };
      case 'return_approved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          text: t('statusText.return_approved') || (lang === 'hi' ? 'वापसी स्वीकृत' : 'Return Approved')
        };
      case 'return_rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          text: t('statusText.return_rejected') || (lang === 'hi' ? 'वापसी अस्वीकृत' : 'Return Rejected')
        };
      case 'returned':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          text: t('statusText.returned') || (lang === 'hi' ? 'वापस किया गया' : 'Returned & Refunded')
        };
      case 'cancelled':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          text: t('statusText.cancelled') || (lang === 'hi' ? 'रद्द किया गया' : 'Cancelled')
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          text: status
        };
    }
  };

  const getStepIndex = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'delivered') return 4;
    if (s === 'out for delivery' || s === 'out_for_delivery') return 3;
    if (s === 'preparing') return 2;
    if (s === 'placed' || s === 'pending') return 1;
    return 0;
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((order) => {
    if (filterTab === 'all') return true;
    const s = (order.status || 'placed').toLowerCase().trim();
    const isActive = s === 'placed' || s === 'pending' || s === 'preparing' || s === 'out for delivery' || s === 'out_for_delivery';
    if (filterTab === 'active') return isActive;
    if (filterTab === 'completed') return !isActive;
    return true;
  });

  const popularCategories = [
    { name: 'Vegetables', label: lang === 'hi' ? 'सब्जियां' : 'Vegetables', icon: '🥬' },
    { name: 'Fruits', label: lang === 'hi' ? 'फल' : 'Fruits', icon: '🍎' },
    { name: 'Drinks', label: lang === 'hi' ? 'पेय पदार्थ' : 'Dairy & Drinks', icon: '🥛' },
    { name: 'Fast Food', label: lang === 'hi' ? 'स्नैक्स' : 'Snacks & Bites', icon: '🍿' }
  ];

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
          transition={{ type: 'spring', damping: 25, stiffness: 240 }}
          className="bg-white w-full max-w-xl h-[92vh] sm:h-auto sm:max-h-[88vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden text-slate-900 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-2xs">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {t('myOrders')}
                  </h2>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black px-2 py-0.5 rounded-full text-[11px]">
                    {orders.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'hi' ? 'लाइव ट्रैकिंग व पिछले ऑर्डर्स का विवरण' : 'Live tracking & purchase history'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs if there are multiple orders */}
          {orders.length > 1 && (
            <div className="flex items-center gap-1.5 pt-3 pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {lang === 'hi' ? 'सभी ऑर्डर्स' : 'All'} ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'active'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {lang === 'hi' ? 'चालू' : 'Active'} (
                {
                  orders.filter((o) => {
                    const s = (o.status || '').toLowerCase().trim();
                    return s === 'placed' || s === 'pending' || s === 'preparing' || s === 'out for delivery' || s === 'out_for_delivery';
                  }).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'completed'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {lang === 'hi' ? 'पूर्ण / अन्य' : 'Completed'}
              </button>
            </div>
          )}

          {/* Orders Stream / Empty State */}
          <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar py-3.5 space-y-4">
            {orders.length === 0 ? (
              /* Professional, Beautifully Styled Empty State */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col items-center justify-between text-center px-3 py-4 sm:py-6"
              >
                {/* Center Card */}
                <div className="w-full flex flex-col items-center max-w-sm my-auto">
                  {/* Decorative Icon Badge */}
                  <div className="relative mb-5">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-emerald-100 via-green-50 to-emerald-200/50 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-600/10 border border-emerald-100/90">
                      <PackageOpen className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5 tracking-tight">
                    {lang === 'hi' ? 'कोई पिछला ऑर्डर नहीं मिला' : 'No Orders Placed Yet'}
                  </h3>

                  <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed max-w-xs mb-6">
                    {lang === 'hi'
                      ? 'आपकी रसोई के लिए ताज़ा फल, सब्जियां और दैनिक किराना सुपरफास्ट 15-30 मिनट में उपलब्ध हैं।'
                      : 'Looks like you have not placed any orders yet. Fresh farm groceries, dairy, and daily essentials are ready for 15-30 min delivery!'}
                  </p>

                  {/* Primary Call to Action */}
                  <button
                    type="button"
                    onClick={() => handleStartShopping()}
                    className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider mb-3"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'अभी खरीदारी शुरू करें' : 'Start Shopping Now'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {!isLoggedIn && onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline mb-5 cursor-pointer flex items-center gap-1"
                    >
                      <span>{lang === 'hi' ? 'पुराने ऑर्डर ट्रैक करने के लिए लॉगिन करें' : 'Have an account? Sign in to view past orders'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Quick Categories Bar */}
                  <div className="w-full pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                      {lang === 'hi' ? 'लोकप्रिय श्रेणियां' : 'Quick Category Picks'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {popularCategories.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleStartShopping(cat.name)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Professional Value Props Banner at bottom of empty state */}
                <div className="w-full grid grid-cols-3 gap-2 pt-6 mt-4 border-t border-slate-100 text-slate-600">
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <Zap className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-[10px] font-black text-slate-800 leading-tight">
                      {lang === 'hi' ? '15-30 मिनट' : '15-30 Mins'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">
                      {lang === 'hi' ? 'सुपरफास्ट' : 'Fast Delivery'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-green-600 mb-1" />
                    <span className="text-[10px] font-black text-slate-800 leading-tight">
                      {lang === 'hi' ? 'ताज़ा व सुरक्षित' : '100% Fresh'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">
                      {lang === 'hi' ? 'गुणवत्ता' : 'Quality Assured'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <RotateCcw className="w-4 h-4 text-blue-600 mb-1" />
                    <span className="text-[10px] font-black text-slate-800 leading-tight">
                      {lang === 'hi' ? 'सरल वापसी' : 'Easy Return'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">
                      {lang === 'hi' ? 'डोरस्टेप पिकअप' : 'Doorstep Pickup'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-xs font-semibold">
                  {lang === 'hi' ? 'इस फ़िल्टर में कोई ऑर्डर नहीं है' : 'No orders found in this category'}
                </p>
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className="mt-2 text-xs font-bold text-emerald-600 underline cursor-pointer"
                >
                  {lang === 'hi' ? 'सभी ऑर्डर्स देखें' : 'View all orders'}
                </button>
              </div>
            ) : (
              /* Enhanced Order Cards */
              filteredOrders.map((order) => {
                const normStatus = (order.status || 'placed').toLowerCase().trim();
                const badge = getStatusBadge(order.status);
                const step = getStepIndex(order.status);

                let formattedDate = 'Just now';
                if (order.createdAt?.toDate) {
                  formattedDate = order.createdAt.toDate().toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                } else if (order.createdAt?.seconds) {
                  formattedDate = new Date(order.createdAt.seconds * 1000).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                }

                const canCancel = normStatus === 'placed' || normStatus === 'pending';
                const canReturn = normStatus === 'delivered';
                const isReturned = normStatus === 'returned';
                const isReturnRequested = normStatus === 'return_requested' || normStatus === 'return_pending';
                const isReturnApproved = normStatus === 'return_approved';
                const isReturnRejected = normStatus === 'return_rejected';
                const canReorder =
                  normStatus === 'delivered' ||
                  normStatus === 'cancelled' ||
                  normStatus === 'returned' ||
                  isReturnApproved ||
                  isReturnRejected;

                const isLiveTracking = step > 0 && step < 4;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3.5"
                  >
                    {/* Top Row: Order ID, Date & Status Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black text-slate-800 tracking-tight">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyOrderId(order.id, e)}
                            title="Copy full Order ID"
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded cursor-pointer"
                          >
                            {copiedId === order.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tight shadow-2xs ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.text}</span>
                      </div>
                    </div>

                    {/* Live Delivery Progress Tracker for active orders */}
                    {step > 0 && !isReturnRequested && !isReturnApproved && !isReturnRejected && !isReturned && (
                      <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className={step >= 1 ? 'text-emerald-700 font-black' : ''}>
                            {lang === 'hi' ? 'प्राप्त' : 'Placed'}
                          </span>
                          <span className={step >= 2 ? 'text-emerald-700 font-black' : ''}>
                            {lang === 'hi' ? 'तैयार' : 'Packing'}
                          </span>
                          <span className={step >= 3 ? 'text-emerald-700 font-black' : ''}>
                            {lang === 'hi' ? 'रास्ते में' : 'On The Way'}
                          </span>
                          <span className={step >= 4 ? 'text-emerald-700 font-black' : ''}>
                            {lang === 'hi' ? 'पहुंचा' : 'Delivered'}
                          </span>
                        </div>

                        {/* Progress Bar Line */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              step === 4
                                ? 'bg-emerald-600'
                                : 'bg-gradient-to-r from-emerald-500 to-green-500'
                            }`}
                            style={{ width: `${(step / 4) * 100}%` }}
                          />
                        </div>

                        {isLiveTracking && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold pt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              {step === 1 && (lang === 'hi' ? 'दुकानदार आपके ताज़ा सामान को इकट्ठा कर रहा है' : 'Store is preparing your fresh order')}
                              {step === 2 && (lang === 'hi' ? 'सामान पैक किया जा रहा है और राइडर को सौंपा जा रहा है' : 'Items being packed and assigned to delivery partner')}
                              {step === 3 && (lang === 'hi' ? 'डिलीवरी पार्टनर आपके पते की ओर निकल चुका है' : 'Delivery rider is on the way to your address')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Items Preview */}
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <ShoppingBasket className="w-3 h-3 text-emerald-600" />
                          <span>{t('items')} ({order.items?.length || 0})</span>
                        </span>
                        <span>{lang === 'hi' ? 'रकम' : 'Subtotal'}</span>
                      </div>

                      <div className="space-y-1 divide-y divide-slate-100/80">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="pt-1 first:pt-0 flex justify-between font-medium items-center">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate text-slate-800 font-bold">{item?.name || 'Item'}</span>
                              <span className="text-[11px] text-slate-500 font-semibold shrink-0">× {item?.qty || 1}</span>
                            </div>
                            <span className="font-bold text-slate-900 shrink-0">
                              ₹{(Number(item?.price) || 0) * (Number(item?.qty) || 1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Return Info Box if Return was requested, approved, rejected, or completed */}
                    {(isReturnRequested || isReturnApproved || isReturnRejected || isReturned) && (
                      <div
                        className={`p-3 rounded-xl text-xs space-y-1.5 ${
                          isReturnApproved
                            ? 'bg-emerald-50/95 border border-emerald-200 text-emerald-950'
                            : isReturnRejected
                            ? 'bg-rose-50/95 border border-rose-200 text-rose-950'
                            : 'bg-amber-50/95 border border-amber-200 text-amber-950'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider ${
                            isReturnApproved
                              ? 'text-emerald-800'
                              : isReturnRejected
                              ? 'text-rose-800'
                              : 'text-amber-800'
                          }`}
                        >
                          {isReturnApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isReturnRejected ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>
                            {isReturnApproved
                              ? (lang === 'hi' ? 'वापसी अनुरोध स्वीकृत' : 'Return Request Approved')
                              : isReturnRejected
                              ? (lang === 'hi' ? 'वापसी अनुरोध अस्वीकृत' : 'Return Request Rejected')
                              : isReturned
                              ? (lang === 'hi' ? 'वापसी पूर्ण' : 'Return Completed')
                              : (lang === 'hi' ? 'वापसी अनुरोध विचाराधीन' : 'Return Request In Review')}
                          </span>
                        </div>

                        {isReturnApproved && (
                          <p className="text-[11px] text-emerald-800 font-medium">
                            {lang === 'hi'
                              ? 'आपकी वापसी स्वीकार कर ली गई है। डिलीवरी पार्टनर जल्द ही सामान लेने पहुंचेगा और रिफंड प्रोसेस होगा।'
                              : 'Your return has been approved. A pickup partner will collect the items soon and initiate your refund.'}
                          </p>
                        )}
                        {isReturnRejected && (
                          <p className="text-[11px] text-rose-800 font-medium">
                            {lang === 'hi'
                              ? 'दुकानदार द्वारा यह वापसी अनुरोध समीक्षा के बाद अस्वीकार कर दिया गया है।'
                              : 'This return request was reviewed and could not be approved.'}
                          </p>
                        )}
                        {isReturnRequested && (
                          <p className="text-[11px] text-amber-800 font-medium">
                            {lang === 'hi'
                              ? 'आपका वापसी अनुरोध स्टोर टीम द्वारा समीक्षा के अधीन है।'
                              : 'Your return request is currently under review by our store team.'}
                          </p>
                        )}

                        {order.returnReason && (
                          <p className="text-[11px] font-semibold text-slate-800 pt-0.5">
                            <span className="font-bold opacity-75">{lang === 'hi' ? 'कारण:' : 'Reason:'}</span> {order.returnReason}
                          </p>
                        )}
                        {order.returnNotes && (
                          <p className="text-[10px] text-slate-600 italic">
                            "{order.returnNotes}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: Total & Action Buttons */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('grandTotal')}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-black text-base text-slate-900 tracking-tight">
                            ₹{order.total}
                          </span>
                          {order.paymentMethod === 'online' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              {order.paymentStatus === 'paid' ? (lang === 'hi' ? 'ऑनलाइन भुगतान' : 'Paid Online') : (lang === 'hi' ? 'भुगतान प्रतीक्षारत' : 'Payment Pending')}
                            </span>
                          ) : order.paymentMethod === 'upi_qr' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Zap className="w-2.5 h-2.5" />
                              {order.paymentStatus === 'paid'
                                ? (lang === 'hi' ? 'UPI सत्यापित' : 'UPI Verified')
                                : (lang === 'hi' ? 'UPI सत्यापन जारी' : 'UPI Verification')}
                              {order.upiTransactionId ? ` (${order.upiTransactionId.slice(-4)})` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Truck className="w-2.5 h-2.5" />
                              {lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Cancel, Return, Reorder */}
                      <div className="flex items-center gap-2">
                        {/* Cancel Order */}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => onCancelOrder(order.id)}
                            className="text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer uppercase tracking-tight shadow-2xs"
                          >
                            {t('cancel')}
                          </button>
                        )}

                        {/* Return Order Button */}
                        {canReturn && (
                          <button
                            type="button"
                            onClick={() => onRequestReturn(order)}
                            className="text-[11px] font-black text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 uppercase tracking-tight shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{t('return')}</span>
                          </button>
                        )}

                        {/* Reorder Button */}
                        {canReorder && (
                          <button
                            type="button"
                            onClick={() => onReorder(order)}
                            className="text-[11px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 uppercase tracking-tight shadow-2xs"
                          >
                            <ShoppingBag className="w-3 h-3 text-emerald-700" />
                            <span>{t('reorder')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
