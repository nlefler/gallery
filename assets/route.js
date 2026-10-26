// The parts of the site that don't touch the page, so they can be tested alone.

// "#/street/3" -> {slug: 'street', photo: 2} (the photo is 0-based, the
// address 1-based). No slug: the first tab. No photo: null (the grid).
export function parseHash(hash) {
  const [slug = '', n = ''] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const photo = /^[1-9]\d*$/.test(n) ? Number(n) - 1 : null;
  return { slug, photo };
}

export const tabHash = (slug) => `#/${encodeURIComponent(slug)}`;
export const photoHash = (slug, i) => `${tabHash(slug)}/${i + 1}`;

// The tab an address names, or the first one if it names none we have.
export function pickTab(tabs, slug) {
  return tabs.find((t) => t.slug === slug) ?? tabs[0] ?? null;
}

export const THUMB_EDGE = 400; // photodesk's thumbnails' longest side

// The images' widths, for srcset: the thumbnail's and the large one's.
export function widths({ w, h }) {
  const scale = Math.min(1, THUMB_EDGE / Math.max(w, h));
  return { thumb: Math.max(1, Math.round(w * scale)), large: w };
}

// The photo n steps from i, wrapping round at the ends.
export const step = (i, n, count) => (((i + n) % count) + count) % count;
