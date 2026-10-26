# Gallery

A static photo gallery, served by DigitalOcean App Platform (`.do/app.yaml`): a
push to `main` deploys it.

## Where the photos come from

[photodesk](../photodesk) publishes into this folder. Each **gallery tab** there
is a saved search; publishing writes every tab's photos, in the search's order:

| Path | What |
|---|---|
| `data/tabs.json` | `{"tabs": [{"slug", "name"}]}`, in the order they're shown |
| `data/tabs/<slug>.json` | `{"name", "photos": [{"image", "w", "h"}]}` |
| `images/large/<image>.jpg` | the photo, 2048 px on its longest side |
| `images/thumb/<image>.jpg` | its thumbnail, 400 px |

Photodesk owns `data/` and `images/`: it adds what's new and deletes what no tab
shows any more, so don't edit them by hand. Images carry no metadata at all.
After publishing, commit and push:

```sh
git add -A data images && git commit -m "Publish" && git push
```

## The site

`index.html`, `assets/site.css` and `assets/site.js` (no build step, no
dependencies). Each tab is at `#/<slug>` and each photo at `#/<slug>/<n>`, so
both can be linked to. In the viewer, ← and → (or a swipe) step through the
photos and Escape closes it.

To try it locally, serve the folder (it fetches its data, so it doesn't work
from `file://`):

```sh
python3 -m http.server 8000
```

Tests, for the address handling: `node --test tests/*.test.mjs`.
