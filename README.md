# Asuda Yaseen — Work

A one-page list of every project, grouped by type, in English and Kurdish.

## How it works

1. `scripts/sync-github.mjs` reads every repo (private ones included) from GitHub and writes `site/data/github.json`. It stores names and dates only. No code is read or published.
2. `site/app.js` shows each project's name, using the titles in `site/content/projects.json`.
3. `scripts/deploy.mjs` publishes `site/` to GitHub Pages (the `gh-pages` branch).

New repos show up on their own. Until you give one a title in `projects.json`, the site uses its repo name.

## Editing content — no code needed

- **`site/content/projects.json`**: the name (English + Kurdish) and category of each repo. Use `"hidden": true` to hide one.
- **`site/content/site.json`**: name, role, bio, location and contact links. Add your email here.
- **`site/content/figma.json`**: add the names of your Figma designs:

```json
{ "designs": [ { "title": { "en": "Banking App", "ku": "ئەپی بانک" } } ] }
```

## Commands

```bash
npm run sync     # refresh the repo list
npm run serve    # preview at http://localhost:4321
npm run deploy   # publish to GitHub Pages
```

## Daily auto-update

`.github/workflows/deploy.yml` runs every day, on every push, and when you start it by hand. It needs one secret:

1. Create a **fine-grained token** under github.com → Settings → Developer settings → Personal access tokens. Give it **All repositories** with **Metadata: Read-only**.
2. In this repo, go to Settings → Secrets and variables → Actions → **New repository secret**. Name it `SHOWCASE_TOKEN`.
