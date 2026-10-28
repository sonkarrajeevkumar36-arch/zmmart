import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingCart, Zap, Sparkles, Tag } from 'lucide-react';
import { Product, Language } from '../types';
import { getTranslation } from '../translations';

interface ProductDetailsModalProps {
  isOpen: boolean;
  product: Product | null;
  lang: Language;
  quantityInCart: number;
  onClose: () => void;
  onAddToCart: (product: Product, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onOpenCart?: () => void;
}

export function ProductDetailsModal({
  isOpen,
  product,
  lang,
  quantityInCart,
  onClose,
  onAddToCart,
  onUpdateQty,
  onOpenCart
}: ProductDetailsModalProps) {
  if (!isOpen || !product) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);
  const isAvailable = product.status === 'Available';
  const price = Number(product.price) || 0;
  const unitLabel = lang === 'hi' && product.unit
    ? t(`units.${(product.unit || '').toLowerCase()}`) || product.unit
    : (product.unit || 'kg');

  const formattedDescription = (product.description || '').trim();

  return (
    <AnimatePresence>
      <div
        id="product-details-modal-backdrop"
        className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="product-details-modal"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] text-slate-900 border border-slate-100 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Sticky Bar with Title & Close button */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200/80">
                {product.category || 'Grocery'}
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {product.name}
              </h2>
            </div>

            <button
              id="close-product-details-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close product details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6 flex-1 hide-scrollbar">
            {/* Large Product Image Container */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-3xl p-6 h-60 sm:h-72 flex items-center justify-center relative border border-slate-100 overflow-hidden shadow-inner group">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-md select-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.fallbackApplied) {
                    target.dataset.fallbackApplied = 'true';
                    target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
                  }
                }}
              />

              {/* Status pill badge */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                {isAvailable ? (
                  <span className="inline-flex items-center gap-1 bg-white/95 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs border border-green-200 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>In Stock</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-900/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider backdrop-blur-md">
                    {product.status === 'Out of Stock' ? t('soldOut') : product.status}
                  </span>
                )}
              </div>

              {/* Delivery ETA pill badge */}
              <div className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-1.5 bg-white/95 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-slate-200/80 backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>15-25 mins delivery</span>
              </div>
            </div>

            {/* Product Title & Pricing Bar */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-semibold">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{product.category}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {unitLabel}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl sm:text-3xl font-black text-green-700 tracking-tight leading-none">
                    ₹{price}
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mt-1">
                    per {unitLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Full Product Description Section */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{t('productDescription')}</span>
                </h3>
                {formattedDescription && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    Verified Store Item
                  </span>
                )}
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/90 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-2xs">
                {formattedDescription ? (
                  <p className="whitespace-pre-line leading-relaxed font-medium">
                    {formattedDescription}
                  </p>
                ) : (
                  <p className="text-slate-500 leading-relaxed italic">
                    {t('noDescription')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar with Working Add to Cart & Controls */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] sticky bottom-0 z-20">
            {isAvailable ? (
              quantityInCart > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Quantity Stepper with subtotal */}
                  <div className="w-full sm:flex-1 flex items-center justify-between bg-green-50/80 border-2 border-green-600 rounded-2xl p-1.5 shadow-sm">
                    <button
                      id="details-minus-qty-btn"
                      type="button"
                      onClick={() => onUpdateQty(product.id, -1)}
                      className="w-10 h-10 flex items-center justify-center font-black text-green-800 hover:bg-green-200/80 rounded-xl transition-all active:scale-90 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <div className="text-center px-3">
                      <div className="text-base font-black text-green-900 leading-tight">
                        {quantityInCart} in Cart
                      </div>
                      <div className="text-[10px] font-bold text-green-700">
                        Total: ₹{price * quantityInCart}
                      </div>
                    </div>

                    <button
                      id="details-plus-qty-btn"
                      type="button"
                      onClick={() => onUpdateQty(product.id, 1)}
                      className="w-10 h-10 flex items-center justify-center font-black text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all active:scale-90 shadow-xs cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* View Cart Shortcut Button */}
                  {onOpenCart && (
                    <button
                      id="details-open-cart-btn"
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCart();
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t('cart')} ({quantityInCart})</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  id="details-add-to-cart-btn"
                  type="button"
                  onClick={(e) => onAddToCart(product, e)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-green-600/25 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>{t('addToCart')}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black bg-white/20 px-3 py-1 rounded-xl">
                    ₹{price} / {unitLabel}
                  </span>
                </button>
              )
            ) : (
              <button
                type="button"
                disabled
                className="w-full bg-slate-200 text-slate-400 font-black text-sm py-3.5 px-6 rounded-2xl cursor-not-allowed uppercase tracking-wider text-center"
              >
                {t('soldOut')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
