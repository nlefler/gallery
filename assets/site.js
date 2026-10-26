import { parseHash, tabHash, photoHash, pickTab, widths, step } from './route.js';

// Everything the site shows comes from data/, which photodesk writes when it
// publishes: data/tabs.json lists the tabs, data/tabs/<slug>.json each one's
// photos, and images/{large,thumb}/<image>.jpg are the photos themselves.

const SITE = document.title;
const nav = document.querySelector('.tabs');
const grid = document.querySelector('.grid');
const note = document.querySelector('.note');
const viewer = document.querySelector('.viewer');
const shown = viewer.querySelector('.viewer-img');
const counter = viewer.querySelector('.viewer-count');

const large = (p) => `images/large/${p.image}.jpg`;
const thumb = (p) => `images/thumb/${p.image}.jpg`;

// Always asked of the server (a 304 if unchanged), so a new publish shows at once.
const load = async (url) => {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

let tabs = [];
let current = null; // {slug, name, photos}
let opened = false; // the viewer was opened from the grid, so Back closes it

function showTabs(active) {
  nav.hidden = tabs.length < 2;
  nav.replaceChildren(...tabs.map((t) => {
    const a = document.createElement('a');
    a.href = tabHash(t.slug);
    a.textContent = t.name;
    if (t.slug === active) a.setAttribute('aria-current', 'page');
    return a;
  }));
}

function showGrid() {
  const { photos, slug } = current;
  note.hidden = photos.length > 0;
  note.textContent = 'No photos here yet.';
  grid.replaceChildren(...photos.map((p, i) => {
    const a = document.createElement('a');
    a.href = photoHash(slug, i);
    a.className = 'cell';
    // Each grows in proportion to its width, so a row's photos come out the same height.
    const ratio = p.w / p.h;
    a.style.setProperty('--ratio', ratio.toFixed(4));
    const img = document.createElement('img');
    const { thumb: tw, large: lw } = widths(p);
    img.src = thumb(p);
    img.srcset = `${thumb(p)} ${tw}w, ${large(p)} ${lw}w`;
    // About as wide as it's drawn, rows being stretched a little past --row.
    img.sizes = `(max-width: 600px) ${Math.ceil(ratio * 200)}px, ${Math.ceil(ratio * 340)}px`;
    img.width = p.w;
    img.height = p.h;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = `Photo ${i + 1} of ${photos.length}`;
    a.append(img);
    return a;
  }));
}

function showPhoto(i) {
  const { photos } = current;
  const p = photos[i];
  shown.src = large(p);
  shown.width = p.w;
  shown.height = p.h;
  shown.alt = `Photo ${i + 1} of ${photos.length}`;
  counter.textContent = `${i + 1} / ${photos.length}`;
  viewer.querySelectorAll('.viewer-prev, .viewer-next').forEach((b) => (b.hidden = photos.length < 2));
  for (const n of [1, -1]) new Image().src = large(photos[step(i, n, photos.length)]); // ready for next
  if (!viewer.open) viewer.showModal();
}

async function route() {
  const { slug, photo } = parseHash(location.hash);
  const tab = pickTab(tabs, slug);
  if (!tab) {
    note.hidden = false;
    note.textContent = 'Nothing has been published yet.';
    return;
  }
  if (current?.slug !== tab.slug) {
    let data;
    try {
      data = await load(`data/tabs/${encodeURIComponent(tab.slug)}.json`);
    } catch {
      note.hidden = false;
      note.textContent = 'This gallery couldn’t be loaded. Try again in a moment.';
      return;
    }
    if (parseHash(location.hash).slug !== slug) return; // moved on meanwhile
    current = { slug: tab.slug, ...data };
    showTabs(tab.slug);
    showGrid();
    document.title = tabs.length > 1 ? `${tab.name} · ${SITE}` : SITE;
  }
  if (photo != null && photo < current.photos.length) {
    showPhoto(photo);
  } else {
    opened = false;
    if (viewer.open) viewer.close();
  }
}

// --- the viewer --------------------------------------------------------------

function go(n) {
  const { photo } = parseHash(location.hash);
  if (photo == null) return;
  // Stepping through doesn't fill the history: Back still goes to the grid.
  history.replaceState(null, '', photoHash(current.slug, step(photo, n, current.photos.length)));
  route();
}

function close() {
  if (opened) history.back();
  else history.replaceState(null, '', tabHash(current.slug));
  route();
}

grid.addEventListener('click', (e) => {
  if (e.target.closest('.cell') && !e.metaKey && !e.ctrlKey && !e.shiftKey) opened = true;
});
viewer.querySelector('.viewer-prev').addEventListener('click', () => go(-1));
viewer.querySelector('.viewer-next').addEventListener('click', () => go(1));
viewer.querySelector('.viewer-close').addEventListener('click', () => close());
viewer.addEventListener('cancel', (e) => {
  e.preventDefault(); // Escape: close it the same way as the button
  close();
});
// A click on the dark around the photo closes it, as on the photo's own blank edges.
viewer.addEventListener('click', (e) => {
  if (e.target === viewer || e.target.classList.contains('viewer-stage')) close();
});
viewer.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
});

// Swiping left or right on a touch screen.
let swipe = null;
viewer.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') swipe = { x: e.clientX, y: e.clientY };
});
viewer.addEventListener('pointerup', (e) => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) go(dx < 0 ? 1 : -1);
});
viewer.addEventListener('pointercancel', () => (swipe = null));

window.addEventListener('hashchange', route);

(async () => {
  try {
    tabs = (await load('data/tabs.json')).tabs;
  } catch {
    tabs = [];
  }
  route();
})();
