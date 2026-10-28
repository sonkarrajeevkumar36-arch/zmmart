import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, CheckCircle2, Sliders, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../translations';
import {
  THEME_PRESETS,
  DEFAULT_PALETTE,
  BannerThemePalette,
  generatePaletteFromHex
} from '../utils/themeManager';
import defaultBannerImg from '../assets/images/seasonal_banner.png';

export interface ThemeModalProps {
  isOpen: boolean;
  lang: Language;
  currentThemeKey: string;
  activePalette: BannerThemePalette;
  bannerExtractedPalette?: BannerThemePalette | null;
  isAdminUser?: boolean;
  onClose: () => void;
  onSelectTheme: (
    themeKeyOrHex: string,
    palette: BannerThemePalette,
    saveToStore?: boolean
  ) => void;
}

export function ThemeModal({
  isOpen,
  lang,
  currentThemeKey,
  activePalette,
  bannerExtractedPalette,
  isAdminUser = false,
  onClose,
  onSelectTheme
}: ThemeModalProps) {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(lang, key, params);

  const [selectedKey, setSelectedKey] = useState<string>(currentThemeKey || 'auto');
  const [customHex, setCustomHex] = useState<string>(
    currentThemeKey?.startsWith('#') ? currentThemeKey : '#dc2626'
  );
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);

  // Sync state whenever modal opens or currentThemeKey changes
  useEffect(() => {
    if (isOpen) {
      setSelectedKey(currentThemeKey || 'auto');
      if (currentThemeKey?.startsWith('#')) {
        setCustomHex(currentThemeKey);
      }
    }
  }, [isOpen, currentThemeKey]);

  if (!isOpen) return null;

  // Resolve currently highlighted preview palette
  const getPreviewPalette = (): BannerThemePalette => {
    if (selectedKey === 'auto') {
      return bannerExtractedPalette || DEFAULT_PALETTE;
    }
    if (selectedKey === 'custom') {
      return generatePaletteFromHex(customHex, 'Custom Brand');
    }
    return THEME_PRESETS[selectedKey] || activePalette;
  };

  const previewPalette = getPreviewPalette();

  const handleApply = () => {
    const finalPalette = getPreviewPalette();
    const finalKey = selectedKey === 'custom' ? customHex.trim() : selectedKey;
    onSelectTheme(finalKey, finalPalette, saveAsDefault);
    onClose();
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
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors"
                style={{ backgroundColor: previewPalette.primary }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {lang === 'hi' ? 'ऐप यूआई और बैनर थीम' : 'App UI & Banner Theme'}
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {lang === 'hi'
                    ? 'बैनर थीम के अनुसार पूरे ऐप का रंग बदलें'
                    : 'Synchronize the app theme with the banner color'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scroll Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800">
            {/* Live Interactive Preview Card */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  {lang === 'hi' ? 'लाइव यूआई प्रीव्यू' : 'Live UI Preview'}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-2xs transition-colors"
                  style={{ backgroundColor: previewPalette.primary }}
                >
                  {previewPalette.name || 'Selected Theme'}
                </span>
              </div>

              {/* Mock Elements demonstrating dynamic theme */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  className="p-2.5 rounded-xl border flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: previewPalette.primaryLight,
                    borderColor: previewPalette.primaryBorder
                  }}
                >
                  <div className="flex flex-col">
                    <span
                      className="text-[10px] font-black uppercase"
                      style={{ color: previewPalette.primaryText }}
                    >
                      Instant Delivery
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: previewPalette.primary }}
                    >
                      ₹199
                    </span>
                  </div>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ backgroundColor: previewPalette.primary }}
                  >
                    +
                  </span>
                </div>

                <div
                  className="p-2.5 rounded-xl text-white flex items-center justify-between shadow-xs transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${previewPalette.gradientFrom}, ${previewPalette.gradientTo})`
                  }}
                >
                  <span className="text-xs font-black">Checkout</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    3 items
                  </span>
                </div>
              </div>
            </div>

            {/* Option 1: Auto Extract From Banner */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {lang === 'hi' ? '1. स्वचालित बैनर सिंक' : '1. Dynamic Banner Sync'}
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKey('auto')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedKey === 'auto'
                    ? 'bg-slate-900 border-slate-900 ring-2 ring-slate-900/20 text-white shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    <img
                      src={defaultBannerImg}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-black ${selectedKey === 'auto' ? 'text-white' : 'text-slate-900'}`}>
                        {lang === 'hi' ? 'ऑटो बैनर थीम' : 'Auto (From Banner)'}
                      </p>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className={`text-[10px] mt-0.5 ${selectedKey === 'auto' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {lang === 'hi'
                        ? 'बैनर छवि से मुख्य उत्सव रंग स्वतः निकालता है'
                        : 'Automatically matches vibrant colors from seasonal banner'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10"
                    style={{
                      backgroundColor:
                        bannerExtractedPalette?.primary || DEFAULT_PALETTE.primary
                    }}
                  />
                  {selectedKey === 'auto' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Option 2: Festive & Seasonal Presets */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                {lang === 'hi' ? '2. उत्सव एवं सीज़नल थीम्स' : '2. Festive & Seasonal Themes'}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {Object.entries(THEME_PRESETS)
                  .filter(([k]) => k !== 'auto')
                  .map(([key, preset]) => {
                    const isSelected = selectedKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedKey(key)}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-bold leading-tight truncate ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {preset.name.split('&')[0].trim()}
                          </p>
                          <p
                            className={`text-[9px] uppercase font-mono mt-0.5 ${
                              isSelected ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {preset.primary}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Option 3: Custom Brand Hex */}
            <div className="pt-1 border-t border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                {lang === 'hi' ? '3. कस्टम ब्रांड रंग' : '3. Custom Brand Color'}
              </h3>
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    setSelectedKey('custom');
                  }}
                  className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={
                    selectedKey === 'custom'
                      ? customHex
                      : THEME_PRESETS[selectedKey]?.primary || customHex
                  }
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    setSelectedKey('custom');
                  }}
                  placeholder="#dc2626"
                  className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={() => setSelectedKey('custom')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedKey === 'custom'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {selectedKey === 'custom' ? 'Active' : 'Use Custom'}
                </button>
              </div>
            </div>

            {/* Store Admin Default Broadcast Option */}
            {isAdminUser && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      Store Default Broadcast
                    </p>
                    <p className="text-[10px] text-amber-700">
                      Save as default for all visiting customers
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="save-default-toggle"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-2 py-3 rounded-2xl font-black text-xs text-white shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: previewPalette.primary
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {lang === 'hi' ? 'थीम लागू करें' : 'Apply Theme'}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
