import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { extractColorsFromImage, BannerThemePalette } from '../utils/themeManager';

// Default local banner asset (can be replaced in public/ or src/assets/images/)
import defaultBannerImg from '../assets/images/seasonal_banner.png';

/**
 * =========================================================================
 * 🎯 SEASONAL BANNER CONFIGURATION (CHANGE BANNER IMAGE HERE)
 * =========================================================================
 * To update the Seasonal Offers banner image in the code:
 * Simply replace the value of SEASONAL_BANNER_IMAGE_URL below with your image URL,
 * a relative public path, or an imported asset.
 *
 * Supported formats:
 *   1. External web URL:
 *      export const SEASONAL_BANNER_IMAGE_URL = "https://images.unsplash.com/...";
 *
 *   2. File in /public folder (e.g. /public/seasonal_banner.png):
 *      export const SEASONAL_BANNER_IMAGE_URL = "/seasonal_banner.png";
 *
 *   3. Imported local asset:
 *      export const SEASONAL_BANNER_IMAGE_URL = defaultBannerImg;
 * =========================================================================
 */
export const SEASONAL_BANNER_IMAGE_URL: string = defaultBannerImg;

export interface SeasonalOffersProps {
  lang?: Language;
  onSelectOfferCategory?: (categoryName: string) => void;
  onHide?: () => void;
  onHideAll?: () => void;
  bannerUrlOverride?: string;
  onBannerColorExtracted?: (palette: BannerThemePalette) => void;
}

/**
 * SeasonalOffers Component
 * Renders ONLY the pure banner image without any text, buttons, coupons,
 * badges, navigation arrows, or overlays.
 */
export function SeasonalOffers({
  onSelectOfferCategory,
  bannerUrlOverride,
  onBannerColorExtracted
}: SeasonalOffersProps) {
  // Remote banner URL from Firestore if configured by store owner
  const [firestoreBannerUrl, setFirestoreBannerUrl] = useState<string>('');

  // Fallback state if the provided image URL fails to load
  const [imageError, setImageError] = useState<boolean>(false);

  // Sync with Firestore shopControl if a dynamic banner URL is stored
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'shopControl', 'status'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const remoteUrl = data.seasonalBannerUrl || data.bannerUrl || '';
            if (remoteUrl && typeof remoteUrl === 'string') {
              setFirestoreBannerUrl(remoteUrl.trim());
              setImageError(false);
            }
          }
        },
        (err) => {
          console.warn('[SeasonalOffers Firestore Sync]:', err);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('[SeasonalOffers Init Error]:', err);
    }
  }, []);

  // Determine active image source (Override -> Firestore -> Code Config -> Default)
  const resolvedSrc =
    bannerUrlOverride ||
    firestoreBannerUrl ||
    SEASONAL_BANNER_IMAGE_URL ||
    defaultBannerImg;

  // If the resolved URL fails to load, fall back to the local default banner asset
  const activeImageSrc = imageError ? defaultBannerImg : resolvedSrc;

  // Optional click handler to scroll to products if customer taps banner
  const handleBannerClick = () => {
    if (onSelectOfferCategory) {
      onSelectOfferCategory('All');
    }
    const productGrid = document.getElementById('products-section');
    if (productGrid) {
      productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const imgRef = React.useRef<HTMLImageElement>(null);

  // Trigger color extraction if image is already loaded/cached
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && onBannerColorExtracted) {
      try {
        const palette = extractColorsFromImage(img);
        if (palette) {
          onBannerColorExtracted(palette);
        }
      } catch (e) {
        console.warn('[Banner Palette Pre-extraction Note]:', e);
      }
    }
  }, [activeImageSrc, onBannerColorExtracted]);

  return (
    <section
      id="seasonal-offers-container"
      className="w-full my-1.5 sm:my-2"
      aria-label="Special Offers Banner"
    >
      <div
        id="seasonal-banner-card"
        onClick={handleBannerClick}
        className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-white transition-all duration-300 hover:shadow-md cursor-pointer active:scale-[0.995]"
      >
        {/* Pure Image Banner: No text, no buttons, no badges, no overlays */}
        <img
          ref={imgRef}
          id="seasonal-banner-img"
          src={activeImageSrc}
          alt="Zypsomart Special Offer"
          onError={() => setImageError(true)}
          onLoad={(e) => {
            if (onBannerColorExtracted) {
              const palette = extractColorsFromImage(e.currentTarget);
              if (palette) {
                onBannerColorExtracted(palette);
              }
            }
          }}
          referrerPolicy="no-referrer"
          loading="eager"
          className="w-full h-auto object-contain block select-none"
        />
      </div>
    </section>
  );
}
