import { Product } from '../types';

/**
 * In-memory map of product IDs to random rank scores for the current page session.
 * Re-initialized to an empty map on every fresh page load / reload, ensuring that
 * all displayed products across all sections and categories are shuffled into a
 * fresh random order on every page refresh, while staying 100% stable during normal
 * user interactions (category switching, search, cart actions, modal toggles, language change).
 */
const sessionProductRanks = new Map<string, number>();

/**
 * Returns a deduplicated, randomly shuffled copy of the provided products list.
 * 
 * Guarantees:
 * 1. Shuffles all displayed products on every fresh page reload.
 * 2. Applies uniformly to all product sections and categories.
 * 3. Keeps the order completely stable during normal interactions (no visual jumps or reshuffles).
 * 4. Strictly prevents duplicate products by deduplicating on product ID.
 * 5. Leaves product data, prices, stock, cart functionality, and Firestore records 100% untouched.
 * 6. Completely cross-platform (mobile browsers, desktop browsers, and PWA standalone mode).
 */
export function getShuffledProducts(products: Product[]): Product[] {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  // 1. Deduplicate products by id to ensure no duplicates are ever displayed
  const seenIds = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const p of products) {
    if (p && p.id && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      uniqueProducts.push(p);
    }
  }

  // 2. Assign stable random ranks to any product that hasn't received one in this page session
  for (const p of uniqueProducts) {
    if (!sessionProductRanks.has(p.id)) {
      sessionProductRanks.set(p.id, Math.random());
    }
  }

  // 3. Sort by the page-load session rank without mutating original objects or input array
  return [...uniqueProducts].sort((a, b) => {
    const rankA = sessionProductRanks.get(a.id) ?? 0.5;
    const rankB = sessionProductRanks.get(b.id) ?? 0.5;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    // Deterministic tie-breaker in the near-impossible event of identical random numbers
    return (a.id || '').localeCompare(b.id || '');
  });
}
