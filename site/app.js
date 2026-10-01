// Showcase front-end. Everything is rendered from JSON produced by the build:
//   data/github.json   — repos synced from GitHub (scripts/sync-github.mjs)
//   data/demos.json    — which repos run live + screenshots (scripts/build-demos.mjs)
//   content/*.json     — hand-written titles, descriptions, Figma links, profile

const I18N = {
  en: {
    'nav.work': 'Work', 'nav.designs': 'Designs', 'nav.stack': 'Stack', 'nav.contact': 'Contact',
    'lang.switch': 'کوردی',
    'hero.available': 'Available for new projects', 'hero.t1': 'Every project,', 'hero.t2': 'running live.',
    'hero.cta': 'Explore the work', 'hero.contact': 'Get in touch',
    'stat.projects': 'Projects', 'stat.live': 'Live demos', 'stat.commits': 'Commits', 'stat.tech': 'Technologies',
    synced: 'Synced from GitHub',
    'work.title': 'Selected work', 'work.sub': 'Open any project to use it live — on desktop, tablet or phone.',
    'work.search': 'Search projects, tech…', 'work.empty': 'No projects match that search.',
    'designs.title': 'Figma designs', 'designs.sub': 'Interface and product design, embedded live from Figma.',
    'designs.empty': 'Design files are being added.',
    'stack.title': 'What the work is built with', 'stack.sub': 'Measured from the code in every repository.',
    'contact.t1': 'Have a project in mind?', 'contact.t2': 'Let’s build it.',
    'foot.auto': 'This page rebuilds itself from GitHub every day.',
    'viewer.open': 'Open', 'viewer.loading': 'Starting the live app…',
    all: 'All', live: 'Live', private: 'Private', public: 'Open source', app: 'Mobile app',
    tryLive: 'Try it live', viewDesign: 'View design', code: 'Code', updated: 'Updated',
    privateNote: 'Private client code', figma: 'Figma', inFigma: 'Open in Figma',
    email: 'Email me',
  },
  ku: {
    'nav.work': 'کارەکان', 'nav.designs': 'دیزاینەکان', 'nav.stack': 'تەکنەلۆجیا', 'nav.contact': 'پەیوەندی',
    'lang.switch': 'English',
    'hero.available': 'ئامادەم بۆ پرۆجێکتی نوێ', 'hero.t1': 'هەموو پرۆجێکتێک،', 'hero.t2': 'بە لایڤ کار دەکات.',
    'hero.cta': 'کارەکان ببینە', 'hero.contact': 'پەیوەندیم پێوە بکە',
    'stat.projects': 'پرۆجێکت', 'stat.live': 'دیمۆی لایڤ', 'stat.commits': 'کۆمیت', 'stat.tech': 'تەکنەلۆجیا',
    synced: 'لە GitHub ـەوە نوێکراوەتەوە',
    'work.title': 'کارە هەڵبژێردراوەکان', 'work.sub': 'هەر پرۆجێکتێک بکەرەوە و بە لایڤ بەکاری بهێنە — لەسەر کۆمپیوتەر، تابلێت یان مۆبایل.',
    'work.search': 'گەڕان بە ناو پرۆجێکت و تەکنەلۆجیا…', 'work.empty': 'هیچ پرۆجێکتێک لەگەڵ ئەم گەڕانە ناگونجێت.',
    'designs.title': 'دیزاینەکانی Figma', 'designs.sub': 'دیزاینی ڕووکار و بەرهەم، ڕاستەوخۆ لە Figma ـەوە.',
    'designs.empty': 'فایلەکانی دیزاین زیاد دەکرێن.',
    'stack.title': 'کارەکان بەچی دروستکراون', 'stack.sub': 'لە کۆدی هەموو ڕیپۆکانەوە هەژمارکراوە.',
    'contact.t1': 'بیرۆکەی پرۆجێکتێکت هەیە؟', 'contact.t2': 'با دروستی بکەین.',
    'foot.auto': 'ئەم پەڕەیە ڕۆژانە خۆکار لە GitHub ـەوە نوێ دەبێتەوە.',
    'viewer.open': 'کردنەوە', 'viewer.loading': 'ئەپەکە دەکرێتەوە…',
    all: 'هەمووی', live: 'لایڤ', private: 'تایبەت', public: 'کراوە', app: 'ئەپی مۆبایل',
    tryLive: 'بە لایڤ تاقی بکەرەوە', viewDesign: 'دیزاینەکە ببینە', code: 'کۆد', updated: 'نوێکراوەتەوە',
    privateNote: 'کۆدی کڕیاری تایبەت', figma: 'Figma', inFigma: 'لە Figma بیکەرەوە',
    email: 'ئیمەیڵم بۆ بنێرە',
  },
};

const CATEGORIES = {
  system: { en: 'Systems & dashboards', ku: 'سیستەم و داشبۆرد' },
  webapp: { en: 'Web apps', ku: 'وێب ئەپ' },
  website: { en: 'Websites', ku: 'وێبسایت' },
  mobile: { en: 'Mobile apps', ku: 'ئەپی مۆبایل' },
  proposal: { en: 'Proposals & pitches', ku: 'پێشنیار و پێشکەشکردن' },
  design: { en: 'Figma', ku: 'Figma' },
};

const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#663399', Python: '#3572A5',
  Dart: '#00B4AB', Kotlin: '#A97BFF', Swift: '#F05138', PHP: '#4F5D95', Rust: '#dea584', 'C++': '#f34b7d',
  C: '#555555', 'Objective-C': '#438eff', CMake: '#DA3434', Shell: '#89e051',
};

const $ = (s, el = document) => el.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let lang = store.get('lang') === 'ku' ? 'ku' : 'en';
let filter = 'all';
let query = '';
let DATA = null;
const t = (k) => I18N[lang][k] ?? I18N.en[k] ?? k;
const pick = (v) => (v && typeof v === 'object' ? (v[lang] || v.en || '') : (v || ''));

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

function hueFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return [`hsl(${h} 70% 55%)`, `hsl(${(h + 60) % 360} 70% 55%)`];
}

function relTime(iso) {
  const d = new Date(iso);
  const diff = (d - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === 'ku' ? 'ckb' : 'en', { numeric: 'auto' });
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, s] of units) if (Math.abs(diff) >= s || u === 'minute') return rtf.format(Math.round(diff / s), u);
}

function buildProjects(gh, demos, cfg) {
  return gh.repos
    .map((r) => {
      const c = cfg.projects?.[r.name] || {};
      const d = demos[r.name] || {};
      const langs = Object.entries(r.languages || {}).sort((a, b) => b[1] - a[1]).map(([l]) => l);
      return {
        id: r.name,
        title: pick(c.title) || prettify(r.name),
        desc: pick(c.desc) || r.description || '',
        category: c.category || (d.status === 'ok' ? 'webapp' : 'mobile'),
        tags: c.tags || langs.slice(0, 4),
        featured: !!c.featured,
        order: c.order ?? 999,
        hidden: c.hidden || r.empty,
        private: r.private,
        repoUrl: r.url,
        homepage: c.homepage || r.homepage,
        live: d.status === 'ok' && !d.broken && !c.noLive,
        demo: d.status === 'ok' ? d.path : null,
        shot: c.shot || d.shot || null,
        shotMobile: c.shotMobile ?? d.shotMobile ?? null,
        pushedAt: r.pushedAt,
        languages: r.languages || {},
        commits: r.commits || 0,
      };
    })
    .filter((p) => !p.hidden)
    .sort((a, b) => (b.featured - a.featured) || (a.order - b.order) || (new Date(b.pushedAt) - new Date(a.pushedAt)));
}

function figmaEmbed(url) {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
}

/* ---------------- rendering ---------------- */

function applyI18n() {
  document.documentElement.lang = lang === 'ku' ? 'ckb' : 'en';
  document.documentElement.dir = lang === 'ku' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}

function renderProfile() {
  const { site, gh } = DATA;
  document.querySelectorAll('[data-bind="name"]').forEach((el) => { el.textContent = site.name || gh.user.name; });
  document.querySelectorAll('[data-bind="role"]').forEach((el) => { el.textContent = pick(site.role); });
  document.querySelectorAll('[data-bind="bio"]').forEach((el) => { el.textContent = pick(site.bio) || gh.user.bio; });
  document.querySelectorAll('[data-bind="location"]').forEach((el) => { el.textContent = pick(site.location) || gh.user.location; });
  document.querySelectorAll('[data-bind="avatar"]').forEach((el) => { el.src = gh.user.avatar; });
  $('.eyebrow').hidden = site.available === false;
  const time = $('#syncedAt');
  time.dateTime = gh.generatedAt;
  time.textContent = relTime(gh.generatedAt);
  $('#year').textContent = new Date().getFullYear();
  document.title = `${site.name} — ${lang === 'ku' ? 'کارەکان' : 'Work'}`;
}

function countUp(el, to) {
  const start = performance.now();
  const dur = 1100;
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString(lang === 'ku' ? 'ar-IQ' : 'en');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderStats() {
  const { projects, figma } = DATA;
  const tech = new Set(projects.flatMap((p) => Object.keys(p.languages)));
  const vals = {
    projects: projects.length + figma.length,
    live: projects.filter((p) => p.live).length,
    commits: projects.reduce((s, p) => s + p.commits, 0),
    tech: tech.size,
  };
  document.querySelectorAll('[data-stat]').forEach((el) => countUp(el, vals[el.dataset.stat]));
  const words = [...new Set(projects.flatMap((p) => p.tags))].concat(projects.map((p) => p.title));
  const html = words.map((w) => `<span>${esc(w)}</span>`).join('');
  $('#marquee').innerHTML = html + html;
}

function renderFilters() {
  const { projects, figma } = DATA;
  const counts = { all: projects.length };
  projects.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  const keys = ['all', ...Object.keys(CATEGORIES).filter((k) => counts[k])];
  $('#filters').innerHTML = keys.map((k) => `
    <button class="filter" role="tab" type="button" data-f="${k}" aria-selected="${k === filter}">
      ${esc(k === 'all' ? t('all') : pick(CATEGORIES[k]))}<span class="n">${counts[k]}</span>
    </button>`).join('');
}

const ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
  ext: '<svg viewBox="0 0 24 24" class="flip" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
};

function projectCard(p, i) {
  const tpl = $('#cardTpl').content.firstElementChild.cloneNode(true);
  tpl.style.animationDelay = `${Math.min(i, 8) * 40}ms`;
  if (p.featured) tpl.classList.add('featured');
  const [h1, h2] = hueFor(p.id);
  const media = $('.card-media', tpl);
  const fb = $('.card-fallback', media);
  fb.style.setProperty('--hue', h1);
  fb.style.setProperty('--hue2', h2);
  fb.innerHTML = `<span>${esc(p.title.slice(0, 1))}<small>${esc(p.tags[0] || '')}</small></span>`;
  const shot = $('.card-shot', media);
  if (p.shot) { shot.src = p.shot; shot.alt = p.title; shot.onerror = () => shot.remove(); } else shot.remove();
  const phone = $('.card-phone', media);
  if (p.shotMobile) { phone.src = p.shotMobile; phone.onerror = () => phone.remove(); } else phone.remove();
  $('.card-play-label', media).textContent = t('tryLive');
  if (p.live) {
    media.setAttribute('aria-label', `${t('tryLive')}: ${p.title}`);
    media.addEventListener('click', () => openProject(p.id));
  } else {
    media.classList.add('no-demo');
    media.tabIndex = -1;
    $('.card-play', media).remove();
  }

  $('.card-cat', tpl).textContent = pick(CATEGORIES[p.category]) || p.category;
  const badges = [];
  if (p.live) badges.push(`<span class="badge live">${t('live')}</span>`);
  if (p.category === 'mobile' && !p.live) badges.push(`<span class="badge app">${t('app')}</span>`);
  badges.push(p.private ? `<span class="badge private">${t('private')}</span>` : `<span class="badge public">${t('public')}</span>`);
  $('.badges', tpl).innerHTML = badges.join('');
  $('.card-title', tpl).textContent = p.title;
  const desc = $('.card-desc', tpl);
  if (p.desc) desc.textContent = p.desc; else desc.remove();
  $('.tags', tpl).innerHTML = p.tags.map((x) => `<li>${esc(x)}</li>`).join('');
  const date = $('.card-date', tpl);
  date.dateTime = p.pushedAt;
  date.textContent = `${t('updated')} ${relTime(p.pushedAt)}`;

  const actions = [];
  if (p.live) actions.push(`<a href="${esc(p.demo)}" target="_blank" rel="noopener" aria-label="${esc(t('viewer.open'))}: ${esc(p.title)}">${ICONS.ext}${esc(t('viewer.open'))}</a>`);
  else if (p.homepage) actions.push(`<a href="${esc(p.homepage)}" target="_blank" rel="noopener">${ICONS.ext}${esc(t('viewer.open'))}</a>`);
  if (p.repoUrl) actions.push(`<a href="${esc(p.repoUrl)}" target="_blank" rel="noopener">${ICONS.code}${esc(t('code'))}</a>`);
  else actions.push(`<span class="card-date" title="${esc(t('privateNote'))}">${ICONS.lock}</span>`);
  $('.card-actions', tpl).innerHTML = actions.join('');
  return tpl;
}

function renderGrid() {
  const q = query.trim().toLowerCase();
  const list = DATA.projects.filter((p) => (filter === 'all' || p.category === filter)
    && (!q || [p.title, p.desc, p.id, ...p.tags].join(' ').toLowerCase().includes(q)));
  const grid = $('#grid');
  grid.replaceChildren(...list.map(projectCard));
  // featured cards only span two columns when nothing is filtered
  if (filter !== 'all' || q) grid.querySelectorAll('.featured').forEach((c) => c.classList.remove('featured'));
  $('#empty').hidden = list.length > 0;
}

function renderFigma() {
  const { figma } = DATA;
  $('#figmaEmpty').hidden = figma.length > 0;
  $('#figmaGrid').hidden = figma.length === 0;
  $('#figmaGrid').innerHTML = figma.map((f, i) => `
    <article class="card figma-card" style="animation-delay:${i * 40}ms">
      <button class="card-media" type="button" data-figma="${i}" aria-label="${esc(t('viewDesign'))}: ${esc(pick(f.title))}">
        ${f.thumbnail ? `<img class="card-shot" src="${esc(f.thumbnail)}" alt="" loading="lazy" />`
          : `<iframe data-src="${esc(figmaEmbed(f.url))}" title="${esc(pick(f.title))}" tabindex="-1" loading="lazy"></iframe>`}
        <span class="card-play">${ICONS.play}<span>${esc(t('viewDesign'))}</span></span>
      </button>
      <div class="card-body">
        <div class="card-top">
          <span class="card-cat">${esc(pick(CATEGORIES[f.category]) || f.category || t('figma'))}</span>
          <span class="badges"><span class="badge public">
            <svg class="figma-mark" viewBox="0 0 38 57" aria-hidden="true"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1abcfe"/><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0acf83"/><path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#ff7262"/><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#f24e1e"/><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#a259ff"/></svg>Figma</span></span>
        </div>
        <h3 class="card-title">${esc(pick(f.title))}</h3>
        ${f.desc ? `<p class="card-desc">${esc(pick(f.desc))}</p>` : ''}
        <div class="card-foot"><span></span><span class="card-actions">
          <a href="${esc(f.url)}" target="_blank" rel="noopener">${ICONS.ext}${esc(t('inFigma'))}</a></span></div>
      </div>
    </article>`).join('');
  // Figma embeds are heavy: only load them when the card scrolls into view
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const f = e.target;
    f.src = f.dataset.src;
    io.unobserve(f);
  }), { rootMargin: '300px' });
  $('#figmaGrid').querySelectorAll('iframe[data-src]').forEach((f) => io.observe(f));
}

function renderStack() {
  const totals = {};
  DATA.projects.forEach((p) => Object.entries(p.languages).forEach(([l, b]) => { totals[l] = (totals[l] || 0) + b; }));
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = rows[0]?.[1] || 1;
  const count = (l) => DATA.projects.filter((p) => p.languages[l]).length;
  $('#stackBars').innerHTML = rows.map(([l, b]) => `
    <div class="bar" style="--c:${LANG_COLORS[l] || '#8d919b'}">
      <span class="bar-name"><i></i>${esc(l)}</span>
      <span class="bar-val">${((b / sum) * 100).toFixed(1)}% · ${count(l)} ${lang === 'ku' ? 'پرۆجێکت' : 'projects'}</span>
      <span class="bar-track"><span class="bar-fill" data-w="${(b / max) * 100}"></span></span>
    </div>`).join('');
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    $('#stackBars').querySelectorAll('.bar-fill').forEach((f) => { f.style.width = `${f.dataset.w}%`; });
    io.disconnect();
  }, { threshold: 0.2 });
  io.observe($('#stackBars'));
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
  renderFilters();
  renderGrid();
  renderFigma();
  renderStack();
  renderContact();
}

/* ---------------- live viewer ---------------- */

const viewer = $('#viewer');
const iframe = $('#vIframe');
let lastFocus = null;

function setDevice(device) {
  $('#vFrame').dataset.device = device;
  $('#vDevices').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.device === device)));
}

function showViewer({ title, sub, src, openUrl, devices = true }) {
  lastFocus = document.activeElement;
  $('#vTitle').textContent = title;
  $('#vSub').textContent = sub;
  $('#vOpen').href = openUrl;
  $('#vDevices').hidden = !devices;
  setDevice(devices && innerWidth < 720 ? 'mobile' : 'desktop');
  $('#vLoading').classList.remove('done');
  iframe.src = src;
  viewer.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#vClose').focus();
}

function openProject(id, push = true) {
  const p = DATA.projects.find((x) => x.id === id);
  if (!p?.live) return;
  if (push) history.pushState({ v: id }, '', `#/p/${encodeURIComponent(id)}`);
  showViewer({ title: p.title, sub: p.tags.join(' · '), src: p.demo, openUrl: p.demo });
}

function openFigma(i, push = true) {
  const f = DATA.figma[i];
  if (!f) return;
  if (push) history.pushState({ f: i }, '', `#/d/${i}`);
  showViewer({ title: pick(f.title), sub: 'Figma', src: figmaEmbed(f.url), openUrl: f.url, devices: false });
}

function closeViewer(push = true) {
  if (viewer.hidden) return;
  viewer.hidden = true;
  iframe.src = 'about:blank';
  document.body.style.overflow = '';
  if (push && location.hash.startsWith('#/')) history.pushState(null, '', location.pathname + location.search);
  lastFocus?.focus?.();
}

function routeFromHash() {
  const m = location.hash.match(/^#\/(p|d)\/(.+)$/);
  if (!m) return closeViewer(false);
  if (m[1] === 'p') openProject(decodeURIComponent(m[2]), false);
  else openFigma(Number(m[2]), false);
}

iframe.addEventListener('load', () => { if (iframe.src !== 'about:blank') $('#vLoading').classList.add('done'); });
$('#vClose').addEventListener('click', () => closeViewer());
$('#vReload').addEventListener('click', () => { $('#vLoading').classList.remove('done'); iframe.src = iframe.src; });
$('#vDevices').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setDevice(b.dataset.device); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewer(); });
addEventListener('popstate', routeFromHash);

/* ---------------- controls ---------------- */

$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  filter = b.dataset.f;
  $('#filters').querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  renderGrid();
});
$('#q').addEventListener('input', (e) => { query = e.target.value; renderGrid(); });
$('#figmaGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-figma]'); if (b) openFigma(Number(b.dataset.figma)); });
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

/* ---------------- boot ---------------- */

const [gh, demos, cfg, site, figmaCfg] = await Promise.all([
  getJSON('data/github.json', { repos: [], user: {} }),
  getJSON('data/demos.json', {}),
  getJSON('content/projects.json', {}),
  getJSON('content/site.json', {}),
  getJSON('content/figma.json', { designs: [] }),
]);
DATA = {
  gh, site,
  projects: buildProjects(gh, demos, cfg),
  figma: (figmaCfg.designs || []).filter((d) => d.url),
};
renderAll();
routeFromHash();
