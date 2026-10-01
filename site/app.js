// Renders the list of project names from:
//   data/github.json     — repos synced from GitHub (scripts/sync-github.mjs)
//   content/projects.json — project names and categories
//   content/figma.json    — Figma design names
//   content/site.json     — profile and contact links

const I18N = {
  en: {
    'nav.work': 'Work', 'nav.contact': 'Contact', 'lang.switch': 'کوردی',
    'hero.available': 'Available for new projects', 'hero.t1': 'What we’ve', 'hero.t2': 'built.',
    'hero.cta': 'See the work', 'hero.contact': 'Get in touch',
    'stat.projects': 'Projects', 'stat.commits': 'Commits',
    'work.title': 'Projects',
    'contact.t1': 'Have a project in mind?', 'contact.t2': 'Let’s build it.',
    email: 'Email me',
  },
  ku: {
    'nav.work': 'کارەکان', 'nav.contact': 'پەیوەندی', 'lang.switch': 'English',
    'hero.available': 'ئامادەم بۆ پرۆجێکتی نوێ', 'hero.t1': 'ئەوەی', 'hero.t2': 'دروستمان کردووە.',
    'hero.cta': 'کارەکان ببینە', 'hero.contact': 'پەیوەندیم پێوە بکە',
    'stat.projects': 'پرۆجێکت', 'stat.commits': 'کۆمیت',
    'work.title': 'پرۆجێکتەکان',
    'contact.t1': 'بیرۆکەی پرۆجێکتێکت هەیە؟', 'contact.t2': 'با دروستی بکەین.',
    email: 'ئیمەیڵم بۆ بنێرە',
  },
};

const CATEGORIES = {
  system: { en: 'Systems & dashboards', ku: 'سیستەم و داشبۆرد' },
  webapp: { en: 'Web apps', ku: 'وێب ئەپ' },
  website: { en: 'Websites', ku: 'وێبسایت' },
  mobile: { en: 'Mobile apps', ku: 'ئەپی مۆبایل' },
  proposal: { en: 'Proposals', ku: 'پێشنیار و پێشکەشکردن' },
  design: { en: 'Figma designs', ku: 'دیزاینەکانی Figma' },
  other: { en: 'Other', ku: 'هیتر' },
};

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

// GitHub repos + Figma designs, as one list of { title, category }
function buildProjects(gh, cfg, figma) {
  const repos = gh.repos
    .map((r) => {
      const c = cfg.projects?.[r.name] || {};
      return {
        title: c.title || prettify(r.name),
        category: c.category || 'other',
        order: c.order ?? 999,
        hidden: c.hidden || r.empty,
        pushedAt: r.pushedAt,
      };
    })
    .filter((p) => !p.hidden);
  const designs = (figma.designs || [])
    .filter((d) => d.title || d.url)
    .map((d, i) => ({ title: d.title || `Design ${i + 1}`, category: 'design', order: i }));
  return [...repos, ...designs]
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
  document.querySelectorAll('[data-bind="role"]').forEach((el) => { el.textContent = pick(site.role); });
  document.querySelectorAll('[data-bind="bio"]').forEach((el) => { el.textContent = pick(site.bio) || gh.user.bio; });
  document.querySelectorAll('[data-bind="location"]').forEach((el) => { el.textContent = pick(site.location) || gh.user.location; });
  document.querySelectorAll('[data-bind="avatar"]').forEach((el) => { el.src = gh.user.avatar; });
  $('.eyebrow').hidden = site.available === false;
  $('#year').textContent = new Date().getFullYear();
  document.title = `${site.name} — ${lang === 'ku' ? 'کارەکان' : 'Work'}`;
}

function countUp(el, to) {
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / 1100);
    el.textContent = num(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderStats() {
  const vals = {
    projects: DATA.projects.length,
    commits: DATA.gh.repos.reduce((s, r) => s + (r.commits || 0), 0),
  };
  document.querySelectorAll('[data-stat]').forEach((el) => countUp(el, vals[el.dataset.stat]));
  const html = DATA.projects.map((p) => `<span>${esc(pick(p.title))}</span>`).join('');
  $('#marquee').innerHTML = html + html;
}

function renderIndex() {
  const groups = Object.keys(CATEGORIES)
    .map((key) => ({ key, items: DATA.projects.filter((p) => p.category === key) }))
    .filter((g) => g.items.length);
  let n = 0;
  $('#index').innerHTML = groups.map((g) => `
    <section class="group" aria-labelledby="g-${g.key}">
      <header class="group-head">
        <h3 id="g-${g.key}">${esc(pick(CATEGORIES[g.key]))}</h3>
        <span class="group-count">${num(g.items.length)}</span>
      </header>
      <ol class="names">
        ${g.items.map((p) => `
          <li class="name" style="animation-delay:${Math.min(n, 20) * 30}ms">
            <span class="name-n">${String(++n).padStart(2, '0')}</span>
            <span class="name-t">${esc(pick(p.title))}</span>
          </li>`).join('')}
      </ol>
    </section>`).join('');
}

function renderContact() {
  const l = DATA.site.links || {};
  const items = [];
  if (l.email) items.push(`<a class="primary" href="mailto:${esc(l.email)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>${esc(t('email'))}</a>`);
  if (l.github) items.push(`<a href="${esc(l.github)}" target="_blank" rel="noopener"><svg class="fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>GitHub</a>`);
  if (l.linkedin) items.push(`<a href="${esc(l.linkedin)}" target="_blank" rel="noopener"><svg class="fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5z"/></svg>LinkedIn</a>`);
  if (l.x) items.push(`<a href="${esc(l.x)}" target="_blank" rel="noopener"><svg class="fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.3 5.5-6.3zm-1.2 17.9h1.9L7 4.2H5z"/></svg>X</a>`);
  $('#contactLinks').innerHTML = items.join('');
}

function renderAll() {
  applyI18n();
  renderProfile();
  renderStats();
  renderIndex();
  renderContact();
}

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
