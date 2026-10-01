// Publishes site/ to the gh-pages branch of the showcase repo (GitHub Pages).
// Works locally (uses your git credentials) and in CI (uses GITHUB_TOKEN).
import { rm, cp, writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';

const OWNER = process.env.GH_OWNER || 'AsudaXoshnaw';
const REPO = process.env.SHOWCASE_REPO || `${OWNER}.github.io`;
const token = process.env.GITHUB_TOKEN || '';
const remote = token
  ? `https://x-access-token:${token}@github.com/${OWNER}/${REPO}.git`
  : `https://github.com/${OWNER}/${REPO}.git`;
const OUT = path.resolve('.work', 'deploy');

const sh = (cmd) => execSync(cmd, { cwd: OUT, stdio: 'inherit' });

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp('site', OUT, { recursive: true });
// without this, GitHub Pages runs Jekyll and drops folders like Next.js' _next/
await writeFile(path.join(OUT, '.nojekyll'), '');

sh('git init -q -b gh-pages');
sh('git -c core.autocrlf=false add -A');
sh(`git -c user.name="showcase-bot" -c user.email="showcase-bot@users.noreply.github.com" commit -q -m "Deploy ${new Date().toISOString()}"`);
sh(`git push -q -f ${remote} gh-pages`);
console.log(`deployed → https://${REPO.endsWith('.github.io') ? REPO : `${OWNER}.github.io/${REPO}`}/`);
