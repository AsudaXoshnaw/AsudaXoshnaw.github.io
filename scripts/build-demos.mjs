// Clones every repo listed in site/data/github.json, detects how to build it
// (static / vite / next / expo), and publishes the result to site/demos/<name>/
// so each project runs live inside the showcase. Writes site/data/demos.json.
//
//   node scripts/build-demos.mjs            build everything
//   node scripts/build-demos.mjs karzan-car only these repos
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve('.');
const WORK = path.join(ROOT, '.work', 'repos');
const DEMOS = path.join(ROOT, 'site', 'demos');
const SITE_BASE = (process.env.SITE_BASE || '/').replace(/\/?$/, '/');
const OWNER = process.env.GH_OWNER || 'AsudaXoshnaw';
const token = process.env.GH_TOKEN || '';
const only = process.argv.slice(2);

const gh = JSON.parse(await readFile('site/data/github.json', 'utf8'));
const config = JSON.parse(await readFile('site/content/projects.json', 'utf8'));
const prevResults = existsSync('site/data/demos.json')
  ? JSON.parse(await readFile('site/data/demos.json', 'utf8')) : {};

const SKIP_COPY = new Set(['node_modules', '.git', '.github', '.vscode', '.idea', '.claude', '.agent', 'tmp']);

function sh(cmd, cwd, extraEnv = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, {
    cwd, stdio: 'inherit', timeout: 15 * 60_000,
    env: { ...process.env, CI: 'true', NODE_OPTIONS: '--max-old-space-size=4096', ...extraEnv },
  });
}

function clone(name, folder = name) {
  const dir = path.join(WORK, folder);
  if (existsSync(path.join(dir, '.git'))) {
    // .work/repos are throwaway build copies, so always match the remote exactly
    try { sh('git fetch --depth 1 -q origin HEAD && git reset --hard -q FETCH_HEAD', dir); } catch {}
    return dir;
  }
  const url = token
    ? `https://x-access-token:${token}@github.com/${OWNER}/${name}.git`
    : `https://github.com/${OWNER}/${name}.git`;
  sh(`git clone --depth 1 -q ${url} "${dir}"`, WORK);
  return dir;
}

async function readPkg(dir) {
  try { return JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8')); } catch { return null; }
}

function detect(pkg, dir) {
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };
  if (deps.next) return 'next';
  if (deps.expo) return 'expo';
  if (deps.vite) return 'vite';
  if (existsSync(path.join(dir, 'index.html'))) return 'static';
  return 'none';
}

function install(dir) {
  const hasLock = existsSync(path.join(dir, 'package-lock.json'));
  const flags = '--no-audit --no-fund --loglevel=error';
  // plain install first (keeps peer deps such as react-is), then progressively looser fallbacks
  const attempts = [
    `npm ${hasLock ? 'ci' : 'install'} ${flags}`,
    `npm ${hasLock ? 'ci' : 'install'} ${flags} --legacy-peer-deps`,
    `npm install ${flags} --legacy-peer-deps`,
  ];
  for (const [i, cmd] of attempts.entries()) {
    try { sh(cmd, dir); return; } catch (e) { if (i === attempts.length - 1) throw e; }
  }
}

async function copyStatic(src, dest) {
  await cp(src, dest, {
    recursive: true,
    filter: (p) => !SKIP_COPY.has(path.basename(p)) && !/\.(log|md|pdf)$/i.test(p),
  });
}

async function listFiles(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await listFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

// Apps often reference public/ files with root-absolute paths ("/logo.png").
// Under /demos/<name>/ those would 404, so prefix them with the demo base.
async function rebasePublicPaths(outDir, publicDir, base) {
  if (!existsSync(publicDir)) return;
  const publicFiles = (await listFiles(publicDir)).filter((f) => f.length > 1);
  if (!publicFiles.length) return;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const dirs = [...new Set(publicFiles.map((f) => f.split('/')[0]))];
  const re = new RegExp(`(["'\`(=])/(${dirs.map(esc).join('|')})(?=[/"'\`)?#\\s])`, 'g');
  for (const f of await listFiles(outDir)) {
    if (!/\.(js|mjs|css|html|json)$/.test(f)) continue;
    const p = path.join(outDir, f);
    const src = await readFile(p, 'utf8');
    const next = src.replace(re, (_, q, d) => `${q}${base}${d}`);
    if (next !== src) await writeFile(p, next);
  }
}

// BrowserRouter apps see /demos/<name>/ as an unknown route. Rewrite the URL to
// "/" before the app boots so the router starts on its home page.
async function injectRouterFix(outDir) {
  const p = path.join(outDir, 'index.html');
  if (!existsSync(p)) return;
  const html = await readFile(p, 'utf8');
  const fix = `<script>try{history.replaceState(null,'','/'+location.search+location.hash)}catch(e){}</script>`;
  await writeFile(p, html.replace(/<head[^>]*>/i, (m) => `${m}${fix}`));
}

async function usesBrowserRouter(dir) {
  const src = path.join(dir, 'src');
  if (!existsSync(src)) return false;
  for (const f of await listFiles(src)) {
    if (!/\.(jsx?|tsx?)$/.test(f)) continue;
    if (/BrowserRouter|createBrowserRouter/.test(await readFile(path.join(src, f), 'utf8'))) return true;
  }
  return false;
}

async function patchNextConfig(dir, base) {
  const file = ['next.config.ts', 'next.config.mjs', 'next.config.js'].find((f) => existsSync(path.join(dir, f)));
  const extra = `output: 'export', basePath: '${base.replace(/\/$/, '')}', trailingSlash: true, images: { unoptimized: true }, eslint: { ignoreDuringBuilds: true }, typescript: { ignoreBuildErrors: true },`;
  if (!file) {
    await writeFile(path.join(dir, 'next.config.mjs'), `export default { ${extra} };\n`);
    return;
  }
  const p = path.join(dir, file);
  const src = await readFile(p, 'utf8');
  const patched = src.replace(/(const\s+\w+\s*(?::\s*NextConfig)?\s*=\s*\{)/, `$1 ${extra}`);
  if (patched === src) throw new Error('could not patch next config');
  await writeFile(p, patched);
}

async function build(repo) {
  const cfg = config.projects?.[repo.name] || {};
  if (cfg.hidden || repo.empty) return { status: 'skipped' };
  if (cfg.recipe === 'none') return { status: 'none' };

  const repoDir = clone(repo.name, cfg.workdir);
  const dir = cfg.dir ? path.join(repoDir, cfg.dir) : repoDir;
  const pkg = await readPkg(dir);
  const recipe = cfg.recipe || detect(pkg, dir);
  const base = `${SITE_BASE}demos/${repo.name}/`;
  const dest = path.join(DEMOS, repo.name);
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  const env = cfg.env || {};

  if (recipe === 'static') {
    await copyStatic(cfg.staticDir ? path.join(dir, cfg.staticDir) : dir, dest);
  } else if (recipe === 'vite') {
    install(dir);
    sh(`npx vite build --base=${base} --outDir "${path.join(dir, '.showcase-dist')}" --emptyOutDir`, dir, env);
    await cp(path.join(dir, '.showcase-dist'), dest, { recursive: true });
    await rebasePublicPaths(dest, path.join(dir, 'public'), base);
    if (cfg.routerFix ?? await usesBrowserRouter(dir)) await injectRouterFix(dest);
  } else if (recipe === 'next') {
    install(dir);
    await patchNextConfig(dir, base);
    sh('npx next build', dir, env);
    await cp(path.join(dir, 'out'), dest, { recursive: true });
    await rebasePublicPaths(dest, path.join(dir, 'public'), base);
    try { sh('git checkout -- .', repoDir); } catch {}
  } else if (recipe === 'expo') {
    install(dir);
    const appJson = path.join(dir, 'app.json');
    const original = await readFile(appJson, 'utf8');
    const app = JSON.parse(original);
    app.expo.experiments = { ...app.expo.experiments, baseUrl: base.replace(/\/$/, '') };
    app.expo.web = { ...app.expo.web, output: 'single' };
    await writeFile(appJson, JSON.stringify(app, null, 2));
    try {
      sh(`npx expo export --platform web --output-dir "${path.join(dir, '.showcase-dist')}"`, dir, env);
    } finally { await writeFile(appJson, original); }
    await cp(path.join(dir, '.showcase-dist'), dest, { recursive: true });
  } else {
    await rm(dest, { recursive: true, force: true });
    return { status: 'none', recipe };
  }
  if (!existsSync(path.join(dest, cfg.entry || 'index.html'))) throw new Error('no index.html in output');
  return { status: 'ok', recipe, path: `demos/${repo.name}/${cfg.entry || ''}`, builtAt: new Date().toISOString() };
}

await mkdir(WORK, { recursive: true });
await mkdir(DEMOS, { recursive: true });
const results = { ...prevResults };
for (const repo of gh.repos) {
  if (only.length && !only.includes(repo.name)) continue;
  console.log(`\n▶ ${repo.name}`);
  try {
    results[repo.name] = await build(repo);
  } catch (e) {
    console.error(`  ✗ ${repo.name}: ${e.message}`);
    // keep the previous working demo if a rebuild fails
    results[repo.name] = prevResults[repo.name]?.status === 'ok' && existsSync(path.join(DEMOS, repo.name))
      ? prevResults[repo.name] : { status: 'failed', error: String(e.message).slice(0, 300) };
  }
  console.log(`  → ${results[repo.name].status}`);
  // save after every repo so an interrupted run keeps its progress; merge into the
  // file on disk so a screenshot run going on at the same time is not overwritten
  const onDisk = existsSync('site/data/demos.json')
    ? JSON.parse(await readFile('site/data/demos.json', 'utf8')) : {};
  onDisk[repo.name] = results[repo.name];
  await writeFile('site/data/demos.json', JSON.stringify(onDisk, null, 2));
}
const ok = Object.values(results).filter((r) => r.status === 'ok').length;
console.log(`\n${ok} live demos built`);
