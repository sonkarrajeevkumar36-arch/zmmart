# Engineering Guidelines & Architecture Standards for Zypsomart

This project is built and maintained as a production-ready, stable, and maintainable application.

## Core Mandates
- **Stability Over Speed**: Correctness and stability take precedence over quick hacks or workarounds. Fix root causes rather than patching symptoms.
- **Scope Discipline**: Respect existing working features. Do not rewrite working modules or remove functional code.
- **Zero White Screens**: An unhandled exception must never break the entire app into a blank screen. Maintain defensive fallbacks and keep `ErrorBoundary` active.
- **Single-View Client Architecture**: Keep client features streamlined. Avoid adding unsolicited complex server-side infrastructure unless explicitly requested.

## Architecture & Data Guidelines
- **Firebase / Firestore**:
  - `orders`: Tracks user purchases, cancellations, and return requests (`placed`, `pending`, `preparing`, `out for delivery`, `delivered`, `cancelled`, `return_requested`, `returned`, `return_rejected`).
  - `categories`: Catalog categories with icons and normalized names.
  - `products`: Product catalog with pricing, units, images, and availability status.
  - `shopControl/status`: Emergency shop status, delivery charges, support contact number, and app logo URL.
- **Order Status Uniformity**:
  - Maintain consistent lowercase status keys across `OrdersModal`, `AdminModal`, and `App.tsx`.
  - Treat `placed` and `pending` with equivalent user-facing and admin transitions.
  - Treat `out for delivery` and `out_for_delivery` with equal compatibility.
  - Treat return requests (`return_pending` and `return_requested`) with equal compatibility, ensuring seamless display as "Return Requested", robust Firestore security rules compliance, and admin review/approval actions.
- **Admin Access**:
  - The app interface is purely customer-facing on standard navigation.
  - Store administrators access the dashboard via URL parameter `?admin=true` or hash `#admin` protected by a 4-digit PIN (default: `0000`).
- **Data Defensive Fallbacks**:
  - Always provide safe fallbacks for missing or null fields (`product?.name || 'Item'`, `Number(product?.price) || 0`, `order?.items || []`).
  - Gracefully handle offline states with cached `localStorage` catalog data.
- **PWA & Mobile Responsiveness**:
  - Retain `/public/manifest.json` and `/public/sw.js` for installability and fast caching.
  - Native PWA install prompt uses `beforeinstallprompt` event; never force or fake install prompts. Only display the Install App modal if `beforeinstallprompt` has fired and the app is not already running in standalone mode.
  - Keep viewport and mobile scrolling fluid (`touch-action: pan-y`, `-webkit-overflow-scrolling: touch`).
- **Free Delivery Celebration**:
  - The Free Delivery unlocked celebration popup stays visible for exactly 1 second (1000ms) and automatically dismisses.
  - Always clean up the timeout ref on unmount and cancel active timers before starting new ones to prevent duplicate timers and memory leaks.
