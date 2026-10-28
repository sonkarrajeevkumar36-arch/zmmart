import React from 'react';
import { Search, Phone, LogOut, User, Download, ShoppingCart, Package } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Language } from '../types';
import { getTranslation } from '../translations';
import defaultAppLogo from '../assets/logo.png';

interface HeaderProps {
  user: FirebaseUser | null;
  lang: Language;
  searchQuery: string;
  supportNumber: string;
  appLogoUrl: string;
  isSyncing?: boolean;
  isAppInstalled?: boolean;
  canInstall?: boolean;
  cartCount?: number;
  onOpenOrders?: () => void;
  onOpenCart?: () => void;
  onInstallClick?: () => void;
  onOpenTheme?: () => void;
  activeThemePrimary?: string;
  activeThemeName?: string;
  onSearchChange: (q: string) => void;
  onRefresh?: () => void;
  onLanguageToggle: () => void;
  onAuthClick: () => void;
}

export function Header({
  user,
  lang,
  searchQuery,
  supportNumber,
  appLogoUrl,
  isAppInstalled,
  canInstall,
  cartCount = 0,
  onOpenOrders,
  onOpenCart,
  onInstallClick,
  onOpenTheme,
  activeThemePrimary,
  onSearchChange,
  onLanguageToggle,
  onAuthClick
}: HeaderProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-4 pb-3 px-3 sm:px-6 border-b border-slate-100 space-y-2.5 sm:space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        {/* Logo & Branding - Pure customer brand representation */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-white p-1 shrink-0 flex items-center justify-center transition-all"
            style={{ boxShadow: '0 2px 10px -2px var(--theme-shadow)' }}
          >
            <img
              src={appLogoUrl || defaultAppLogo}
              alt="Zypsomart Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultAppLogo;
              }}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-nowrap">
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
                {t('appName')}
              </h1>
              <span className="bg-theme-light text-theme-dark border border-theme-light text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 transition-colors">
                Instant
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 bg-theme-primary transition-colors" />
              <p className="text-[9px] sm:text-[10px] font-black text-theme-dark uppercase tracking-wider whitespace-nowrap transition-colors">
                {t('deliveryTime')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Orders Button */}
          {onOpenOrders && (
            <button
              id="header-orders-btn"
              type="button"
              onClick={onOpenOrders}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title={t('orders')}
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>{t('orders')}</span>
            </button>
          )}

          {/* Desktop Cart Button */}
          {onOpenCart && (
            <button
              id="header-cart-btn"
              type="button"
              onClick={onOpenCart}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-theme-primary hover:bg-theme-primary-hover active:scale-95 text-white rounded-xl text-xs font-black theme-shadow transition-all cursor-pointer"
              title={t('cart')}
            >
              <div className="relative flex items-center">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-amber-400 text-slate-950 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                    {cartCount}
                  </span>
                )}
              </div>
              <span>{t('cart')}</span>
            </button>
          )}

          {/* In-App Install Prompt Button (Hidden if already installed) */}
          {!isAppInstalled && canInstall && onInstallClick && (
            <button
              id="header-install-app-btn"
              type="button"
              onClick={onInstallClick}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-theme-primary hover:bg-theme-primary-hover active:scale-95 text-white rounded-lg text-[10px] sm:text-xs font-black shadow-xs transition-all cursor-pointer"
              title={t('installApp')}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline uppercase tracking-tight">{t('installApp')}</span>
            </button>
          )}

          {/* Theme Switcher Button */}
          {onOpenTheme && (
            <button
              id="header-theme-btn"
              type="button"
              onClick={onOpenTheme}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] sm:text-xs font-black border border-slate-200 uppercase tracking-tight transition-all cursor-pointer active:scale-95"
              title={lang === 'hi' ? 'बैनर थीम बदलें' : 'Change Banner Theme'}
            >
              <span
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0 shadow-2xs transition-colors ring-1 ring-black/20"
                style={{ backgroundColor: activeThemePrimary || 'var(--theme-primary)' }}
              />
              <span className="hidden md:inline text-[10px]">
                {lang === 'hi' ? 'थीम' : 'Theme'}
              </span>
            </button>
          )}

          {/* Language Switch */}
          <button
            type="button"
            onClick={onLanguageToggle}
            className="px-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] sm:text-xs font-black text-slate-700 border border-slate-200 uppercase tracking-tight transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>

          {/* Support Phone */}
          <a
            href={`tel:${supportNumber || '8090315246'}`}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
            title="Call Support"
          >
            <Phone className="w-4 h-4" />
          </a>

          {/* Auth Profile / Logout (Shows Login for guests/anonymous, Logout for logged-in users) */}
          {(() => {
            const isRealUser = Boolean(user && !user.isAnonymous);
            return (
              <button
                type="button"
                onClick={onAuthClick}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-xs font-bold cursor-pointer transition-transform active:scale-90 ${
                  isRealUser ? 'bg-slate-900 text-white hover:bg-red-600' : 'bg-theme-primary text-white hover:bg-theme-primary-hover shadow-xs'
                }`}
                title={isRealUser ? 'Click to Logout' : 'Click to Login'}
              >
                {isRealUser ? <LogOut className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 sm:h-11 pl-9 pr-9 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/20 transition-all shadow-none leading-normal"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  );
}

