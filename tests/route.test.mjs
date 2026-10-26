import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, tabHash, photoHash, pickTab, widths, step } from '../assets/route.js';

test('an address names a tab, and maybe a photo in it', () => {
  assert.deepEqual(parseHash(''), { slug: '', photo: null });
  assert.deepEqual(parseHash('#/street'), { slug: 'street', photo: null });
  assert.deepEqual(parseHash('#/street/3'), { slug: 'street', photo: 2 });
  for (const bad of ['#/street/0', '#/street/x', '#/street/-1', '#/street/1.5']) {
    assert.equal(parseHash(bad).photo, null, bad);
  }
  assert.deepEqual(parseHash(photoHash('a b', 4)), { slug: 'a b', photo: 4 });
  assert.equal(tabHash('street'), '#/street');
});

test('an unknown tab is the first one', () => {
  const tabs = [{ slug: 'a' }, { slug: 'b' }];
  assert.equal(pickTab(tabs, 'b'), tabs[1]);
  assert.equal(pickTab(tabs, 'nope'), tabs[0]);
  assert.equal(pickTab([], 'a'), null);
});

test('thumbnails are 400 on their longest side, or the photo if smaller', () => {
  assert.deepEqual(widths({ w: 2048, h: 1365 }), { thumb: 400, large: 2048 });
  assert.deepEqual(widths({ w: 1365, h: 2048 }), { thumb: 267, large: 1365 });
  assert.deepEqual(widths({ w: 300, h: 200 }), { thumb: 300, large: 300 });
});

test('stepping wraps round', () => {
  assert.equal(step(0, -1, 5), 4);
  assert.equal(step(4, 1, 5), 0);
  assert.equal(step(2, 1, 5), 3);
});
