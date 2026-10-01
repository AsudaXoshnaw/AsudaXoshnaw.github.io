# Asuda Yaseen — Live Showcase

Every GitHub repo and Figma design, running live on one page. The page rebuilds itself every day.

## How it works

| Step | Script | Output |
|---|---|---|
| 1. Read all repos (private included) from GitHub | `scripts/sync-github.mjs` | `site/data/github.json` |
| 2. Clone and build each repo (static / Vite / Next.js / Expo) | `scripts/build-demos.mjs` | `site/demos/<repo>/`, `site/data/demos.json` |
| 3. Screenshot every live demo (desktop + phone) | `scripts/screenshots.mjs` | `site/shots/` |
| 4. Publish `site/` to GitHub Pages | `scripts/deploy.mjs` | `gh-pages` branch |

New repos show up on their own. The code of private repos is never published. Only the **built app** of each one is published, so it can run as a live demo.

## Editing content — no code needed

- **`site/content/site.json`**: name, role, bio, location, contact links (add your email here).
- **`site/content/projects.json`**: title and description (English + Kurdish), category, tags, and `featured`. Set `"hidden": true` to hide a repo, or `"noLive": true` to show a repo without a live demo.
- **`site/content/figma.json`**: add one entry per design:

```json
{
  "designs": [
    {
      "url": "https://www.figma.com/design/XXXXXXXX/My-App",
      "title": { "en": "Banking App", "ku": "ئەپی بانک" },
      "desc": { "en": "Mobile banking UI kit" },
      "category": "mobile"
    }
  ]
}
```

In Figma, open **Share** and set access to **Anyone with the link → can view** so the design can be embedded.

## Commands

```bash
npm install
npx playwright install chromium
npm run build      # sync + demos + screenshots
npm run serve      # http://localhost:4321
npm run deploy     # publish to GitHub Pages
node scripts/build-demos.mjs karzan-car   # rebuild just one repo
```

## Daily auto-update (GitHub Actions)

`.github/workflows/deploy.yml` runs every day at 03:00 UTC, on every push, and when you trigger it by hand. It needs one secret:

1. Create a **fine-grained token** at github.com → Settings → Developer settings → Personal access tokens. Give it access to **All repositories**, with **Contents: Read-only** and **Metadata: Read-only**.
2. In the showcase repo, open Settings → Secrets and variables → Actions → **New repository secret**. Name it `SHOWCASE_TOKEN` and paste the token.
3. In Settings → Pages, set **Source: Deploy from a branch**, **Branch: `gh-pages` / root**.
