// Renders the list of project names from:
//   data/github.json     — repos synced from GitHub (scripts/sync-github.mjs)
//   content/projects.json — project names and categories
//   content/figma.json    — Figma design names
//   content/site.json     — site name

const I18N = {
  en: {
    'nav.work': 'Work', 'lang.switch': 'کوردی',
    'work.title': 'Projects', builtWith: 'Built with', all: 'All',
  },
  ku: {
    'nav.work': 'کارەکان', 'lang.switch': 'English',
    'work.title': 'پرۆجێکتەکان', builtWith: 'دروستکراوە بە', all: 'هەمووی',
  },
};

// applications first, then websites, proposals and designs
const CATEGORIES = {
  system: { en: 'Systems & dashboards', ku: 'سیستەم و داشبۆرد' },
  webapp: { en: 'Web apps', ku: 'وێب ئەپ' },
  mobile: { en: 'Mobile apps', ku: 'ئەپی مۆبایل' },
  website: { en: 'Websites', ku: 'وێبسایت' },
  proposal: { en: 'Proposals', ku: 'پێشنیار و پێشکەشکردن' },
  design: { en: 'Figma designs', ku: 'دیزاینەکانی Figma' },
  other: { en: 'Other', ku: 'هیتر' },
};

// every category belongs to one kind, shown as a badge and used by the filter tabs
const KINDS = {
  app: { en: 'Application', ku: 'ئەپڵیکەیشن', plural: { en: 'Applications', ku: 'ئەپڵیکەیشنەکان' }, cats: ['system', 'webapp', 'mobile'] },
  website: { en: 'Website', ku: 'وێبسایت', plural: { en: 'Websites', ku: 'وێبسایتەکان' }, cats: ['website'] },
  proposal: { en: 'Proposal', ku: 'پێشنیار', plural: { en: 'Proposals', ku: 'پێشنیارەکان' }, cats: ['proposal'] },
  design: { en: 'Design', ku: 'دیزاین', plural: { en: 'Designs', ku: 'دیزاینەکان' }, cats: ['design'] },
  other: { en: 'Project', ku: 'پرۆجێکت', plural: { en: 'Other', ku: 'هیتر' }, cats: ['other'] },
};
const kindOf = (category) => Object.keys(KINDS).find((k) => KINDS[k].cats.includes(category)) || 'other';

const PLATFORMS = {
  web: { en: 'Web', ku: 'وێب', icon: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>' },
  mobile: { en: 'Mobile', ku: 'مۆبایل', icon: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>' },
  desktop: { en: 'Desktop', ku: 'دێسکتۆپ', icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>' },
  kiosk: { en: 'Kiosk', ku: 'کیۆسک', icon: '<rect x="6" y="2" width="12" height="15" rx="2"/><path d="M12 17v5M8 22h8M10 6h4"/>' },
};
let kindFilter = 'all';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let lang = store.get('lang') === 'ku' ? 'ku' : 'en';
let DATA = null;
const t = (k) => I18N[lang][k] ?? I18N.en[k] ?? k;
const pick = (v) => (v && typeof v === 'object' ? (v[lang] || v.en || '') : (v || ''));
const num = (n) => n.toLocaleString(lang === 'ku' ? 'ar-IQ' : 'en');

async function getJSON(url, fallback) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch { return fallback; }
}

function prettify(name) {
  return name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

// GitHub repos + Figma designs, as one list of { title, category, icon, tags }
function buildProjects(gh, cfg, figma) {
  const repos = gh.repos
    .map((r) => {
      const c = cfg.projects?.[r.name] || {};
      const langs = Object.entries(r.languages || {}).sort((a, b) => b[1] - a[1]).map(([l]) => l);
      return {
        title: c.title || prettify(r.name),
        desc: c.desc,
        category: c.category || 'other',
        icon: c.icon,
        platforms: c.platforms || [],
        tags: c.tags || langs.slice(0, 4),
        order: c.order ?? 999,
        hidden: c.hidden || r.empty,
        pushedAt: r.pushedAt,
      };
    })
    .filter((p) => !p.hidden);
  const designs = (figma.designs || [])
    .filter((d) => d.title || d.url)
    .map((d, i) => ({
      title: d.title || `Design ${i + 1}`, category: 'design', icon: d.icon || 'figma',
      tags: d.tags || ['Figma'], order: i,
    }));
  // projects that are not on GitHub, written by hand in projects.json → "extra"
  const extra = (cfg.extra || [])
    .filter((e) => e.title && !e.hidden)
    .map((e) => ({
      title: e.title, desc: e.desc, category: e.category || 'other', icon: e.icon, image: e.image,
      platforms: e.platforms || [], tags: e.tags || [], order: e.order ?? 999,
    }));
  return [...repos, ...extra, ...designs]
    .sort((a, b) => (a.order - b.order) || (new Date(b.pushedAt || 0) - new Date(a.pushedAt || 0)));
}

function applyI18n() {
  document.documentElement.lang = lang === 'ku' ? 'ckb' : 'en';
  document.documentElement.dir = lang === 'ku' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
}

function renderProfile() {
  const { site, gh } = DATA;
  document.querySelectorAll('[data-bind="name"]').forEach((el) => { el.textContent = site.name || gh.user.name; });
  $('#year').textContent = new Date().getFullYear();
  document.title = `${site.name} — ${lang === 'ku' ? 'کارەکان' : 'Work'}`;
}

// Line icons (24×24, stroke) — pick one per project with "icon" in projects.json
const ICONS = {
  stethoscope: '<path d="M5 3v5a5 5 0 0 0 10 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="10" r="2"/>',
  clinic: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M12 9v6M9 12h6M8 2v4M16 2v4"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  directory: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  icecream: '<path d="m7 11 4.1 10.3a1 1 0 0 0 1.8 0L17 11"/><path d="M17 7A5 5 0 0 0 7 7"/><path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
  network: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11l-5.5 6.5M12 11l5.5 6.5"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 6H7.6a2 2 0 0 0-1.7 1L3.6 11A2 2 0 0 0 3 12.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  'sparkle-device': '<rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 6v4M10 8h4"/>',
  ship: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 17.5 21 12l-9-4-9 4 2 5.6M12 2v6M7 5h10"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  cube: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  perfume: '<rect x="5" y="9" width="14" height="13" rx="3"/><path d="M9 9V6h6v3M10 3h4v3h-4z"/>',
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h6M16 13H8M16 17H8M10 9H8"/>',
  package: '<path d="m7.5 4.3 9 5.2M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  graduation: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6"/>',
  figma: '<path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zM12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0zM5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0zM5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  discount: '<path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="m9 15 6-6M9 9h.01M15 15h.01"/>',
};
const CATEGORY_ICON = { system: 'dashboard', webapp: 'layout', website: 'network', mobile: 'graduation', proposal: 'doc', design: 'figma', other: 'code' };
const CATEGORY_HUE = { system: '#7c8cff', webapp: '#3ddc97', website: '#c8f23a', mobile: '#ff8a5c', proposal: '#f5a524', design: '#a259ff', other: '#8d919b' };

// brand colours for the "built with" chips
const TECH_COLORS = {
  react: '#61dafb', 'react native': '#61dafb', next: '#a1a1aa', typescript: '#3178c6', javascript: '#f1e05a',
  node: '#3c873a', express: '#a1a1aa', supabase: '#3ecf8e', firebase: '#ffca28', tailwind: '#38bdf8',
  three: '#a1a1aa', gsap: '#88ce02', framer: '#e946ff', vite: '#a66bff', tauri: '#ffc131', flutter: '#02569b',
  dart: '#00b4ab', expo: '#a1a1aa', html: '#e34c26', css: '#663399', php: '#777bb4', prisma: '#5a67d8',
  recharts: '#22b5bf', bootstrap: '#7952b3', pdf: '#f40f02', sqlite: '#0f80cc', figma: '#a259ff',
};
const techColor = (tag) => {
  const k = tag.toLowerCase();
  const hit = Object.keys(TECH_COLORS).sort((a, b) => b.length - a.length).find((x) => k.includes(x));
  return hit ? TECH_COLORS[hit] : '#8d919b';
};

function renderFilters() {
  const counts = {};
  DATA.projects.forEach((p) => { const k = kindOf(p.category); counts[k] = (counts[k] || 0) + 1; });
  const keys = Object.keys(KINDS).filter((k) => counts[k]);
  if (!keys.includes(kindFilter)) kindFilter = 'all';
  $('#filters').innerHTML = [
    `<button class="filter" type="button" role="tab" data-kind="all" aria-selected="${kindFilter === 'all'}">${esc(t('all'))}<span class="n">${num(DATA.projects.length)}</span></button>`,
    ...keys.map((k) => `<button class="filter" type="button" role="tab" data-kind="${k}" aria-selected="${kindFilter === k}">${esc(pick(KINDS[k].plural))}<span class="n">${num(counts[k])}</span></button>`),
  ].join('');
}

function kindBadge(p) {
  const kind = kindOf(p.category);
  const platforms = (p.platforms || []).filter((x) => PLATFORMS[x]);
  return `
    <div class="pcard-kind">
      <span class="kind kind-${kind}">${esc(pick(KINDS[kind]))}</span>
      ${platforms.length ? `<span class="plats">${platforms.map((x) => `
        <span class="plat" title="${esc(pick(PLATFORMS[x]))}"><svg viewBox="0 0 24 24" aria-hidden="true">${PLATFORMS[x].icon}</svg>${esc(pick(PLATFORMS[x]))}</span>`).join('')}
      </span>` : ''}
    </div>`;
}

function renderIndex() {
  const groups = Object.keys(CATEGORIES)
    .filter((key) => kindFilter === 'all' || kindOf(key) === kindFilter)
    .map((key) => ({ key, items: DATA.projects.filter((p) => p.category === key) }))
    .filter((g) => g.items.length);
  let n = 0;
  $('#index').innerHTML = groups.map((g) => `
    <section class="group" aria-labelledby="g-${g.key}" style="--hue:${CATEGORY_HUE[g.key]}">
      <header class="group-head">
        <h3 id="g-${g.key}">${esc(pick(CATEGORIES[g.key]))}</h3>
        <span class="group-count">${num(g.items.length)}</span>
      </header>
      <ul class="cards">
        ${g.items.map((p) => `
          <li class="pcard" style="animation-delay:${Math.min(n++, 20) * 30}ms">
            <div class="pcard-top">
              ${p.image
                ? `<span class="pcard-icon has-img" aria-hidden="true"><img src="${esc(p.image)}" alt="" loading="lazy" /></span>`
                : `<span class="pcard-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[p.icon] || ICONS[CATEGORY_ICON[p.category]] || ICONS.code}</svg></span>`}
              ${kindBadge(p)}
            </div>
            <h4 class="pcard-title">${esc(pick(p.title))}</h4>
            ${p.desc ? `<p class="pcard-desc">${esc(pick(p.desc))}</p>` : ''}
            <p class="pcard-label">${esc(t('builtWith'))}</p>
            <ul class="techs">${p.tags.map((tag) => `<li style="--c:${techColor(tag)}">${esc(tag)}</li>`).join('')}</ul>
          </li>`).join('')}
      </ul>
    </section>`).join('');
}

function renderAll() {
  applyI18n();
  renderProfile();
  renderFilters();
  renderIndex();
}

$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-kind]');
  if (!b) return;
  kindFilter = b.dataset.kind;
  $('#filters').querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  renderIndex();
});
$('#langBtn').addEventListener('click', () => {
  lang = lang === 'en' ? 'ku' : 'en';
  store.set('lang', lang);
  renderAll();
});
$('#themeBtn').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme
    || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  store.set('theme', next);
});
addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 8), { passive: true });

const [gh, cfg, site, figma] = await Promise.all([
  getJSON('data/github.json', { repos: [], user: {} }),
  getJSON('content/projects.json', {}),
  getJSON('content/site.json', {}),
  getJSON('content/figma.json', { designs: [] }),
]);
DATA = { gh, site, projects: buildProjects(gh, cfg, figma) };
renderAll();
