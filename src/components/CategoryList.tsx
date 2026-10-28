import React from 'react';
import { Category, Language } from '../types';
import { getTranslation } from '../translations';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  lang: Language;
  onSelectCategory: (cat: string) => void;
}

export function CategoryList({
  categories,
  selectedCategory,
  lang,
  onSelectCategory
}: CategoryListProps) {
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 px-1 py-2 -mx-1 touch-pan-x overscroll-x-contain items-start">
      {/* All Option */}
      <button
        type="button"
        onClick={() => onSelectCategory('All')}
        className={`flex flex-col items-center gap-1.5 shrink-0 px-1 py-1 rounded-2xl transition-all cursor-pointer ${
          selectedCategory === 'All' ? 'scale-105' : 'opacity-75 hover:opacity-100'
        }`}
      >
        <div
          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-xs border transition-all ${
            selectedCategory === 'All'
              ? 'bg-theme-primary border-theme-primary text-white theme-shadow ring-2 ring-[var(--theme-primary)]/30'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          🛍️
        </div>
        <span
          className={`text-xs font-bold whitespace-nowrap text-center transition-colors ${
            selectedCategory === 'All' ? 'text-theme-primary font-extrabold' : 'text-slate-600'
          }`}
        >
          {t('categories.all')}
        </span>
      </button>

      {/* Dynamic Categories */}
      {categories.map((cat) => {
        const catName = cat?.name || '';
        const isSelected = (selectedCategory || '').toLowerCase().trim() === catName.toLowerCase().trim();
        return (
          <button
            key={cat.id || Math.random().toString()}
            type="button"
            onClick={() => onSelectCategory(catName)}
            className={`flex flex-col items-center gap-1.5 shrink-0 px-1 py-1 rounded-2xl transition-all cursor-pointer ${
              isSelected ? 'scale-105' : 'opacity-75 hover:opacity-100'
            }`}
          >
            <div
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-xs border transition-all ${
                isSelected
                  ? 'bg-theme-primary border-theme-primary text-white theme-shadow ring-2 ring-[var(--theme-primary)]/30'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {cat.icon || '📦'}
            </div>
            <span
              className={`text-xs font-bold whitespace-nowrap text-center transition-colors ${
                isSelected ? 'text-theme-primary font-extrabold' : 'text-slate-600'
              }`}
            >
              {catName || t('categories.all')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
