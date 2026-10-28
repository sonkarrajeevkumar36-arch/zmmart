import React from 'react';
import { motion } from 'motion/react';
import { Plus, Check } from 'lucide-react';
import { Product, Language } from '../types';
import { getTranslation } from '../translations';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  lang: Language;
  quantityInCart: number;
  onAddToCart: (product: Product, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onSelectProduct?: (product: Product) => void;
}

export function ProductCard({
  product,
  lang,
  quantityInCart,
  onAddToCart,
  onUpdateQty,
  onSelectProduct
}: ProductCardProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);
  const isAvailable = product.status === 'Available';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onSelectProduct?.(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectProduct?.(product);
        }
      }}
      className={`bg-white rounded-2xl p-3 shadow-xs border border-slate-100 flex flex-col justify-between relative transition-all cursor-pointer group hover:border-green-300 hover:shadow-md select-none focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
        !isAvailable ? 'opacity-60' : ''
      }`}
    >
      {/* Product Image */}
      <div className="bg-slate-50 rounded-xl h-28 mb-2 flex items-center justify-center p-2 overflow-hidden relative">
        <img
          referrerPolicy="no-referrer"
          src={product?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80'}
          alt={product?.name || 'Product'}
          className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.dataset.fallbackApplied) {
              target.dataset.fallbackApplied = 'true';
              target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
            }
          }}
        />

        {!isAvailable && (
          <div className="absolute top-2 right-2 bg-slate-900/85 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            {product?.status === 'Out of Stock' ? t('soldOut') : (product?.status || 'Unavailable')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col mb-2">
        <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors" title={product?.name || 'Item'}>
          {product?.name || 'Item'}
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
          {product?.category || 'General'}
        </span>
      </div>

      {/* Price & Add to Cart Controls */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="font-black text-xs sm:text-sm text-slate-900 leading-none">
            ₹{Number(product?.price) || 0}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
            / {lang === 'hi' && product?.unit ? t(`units.${(product.unit || '').toLowerCase()}`) || product.unit : (product?.unit || 'kg')}
          </span>
        </div>

        {quantityInCart > 0 ? (
          <div
            className="flex items-center bg-green-50 border border-green-200 rounded-xl p-0.5 shadow-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(product.id, -1);
              }}
              className="w-6 h-6 flex items-center justify-center font-bold text-green-700 hover:bg-green-100 rounded-lg transition-colors cursor-pointer text-xs"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="w-5 text-center text-xs font-black text-green-900">
              {quantityInCart}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(product.id, 1);
              }}
              className="w-6 h-6 flex items-center justify-center font-bold text-green-700 hover:bg-green-100 rounded-lg transition-colors cursor-pointer text-xs"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, e);
            }}
            disabled={!isAvailable}
            className="bg-white border border-green-600 text-green-700 text-[10px] font-black px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-green-600 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{t('add')}</span>
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
