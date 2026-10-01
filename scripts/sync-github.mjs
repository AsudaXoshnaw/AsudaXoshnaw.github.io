// Pulls every repo (public + private) of the owner from the GitHub API and
// writes site/data/github.json. Private repos are listed without their code.
// Needs GH_TOKEN (a PAT with repo read access) to see private repos; falls back to `gh auth token`.
import { writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const OWNER = process.env.GH_OWNER || 'AsudaXoshnaw';
const token = process.env.GH_TOKEN || (() => {
  try { return execSync('gh auth token', { encoding: 'utf8' }).trim(); } catch { return ''; }
})();
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'asuda-showcase',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

const user = await gh(`/users/${OWNER}`);
// /user/repos includes private repos when the token belongs to the owner
let repos = [];
for (let page = 1; ; page++) {
  const batch = token
    ? await gh(`/user/repos?per_page=100&page=${page}&affiliation=owner&sort=pushed`)
    : await gh(`/users/${OWNER}/repos?per_page=100&page=${page}&sort=pushed`);
  repos.push(...batch);
  if (batch.length < 100) break;
}
repos = repos.filter((r) => r.owner.login.toLowerCase() === OWNER.toLowerCase() && !r.fork);

const out = [];
for (const r of repos) {
  let languages = {};
  try { languages = await gh(`/repos/${OWNER}/${r.name}/languages`); } catch {}
  let commits = 0;
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${r.name}/commits?per_page=1`, { headers });
    const m = (res.headers.get('link') || '').match(/page=(\d+)>; rel="last"/);
    commits = m ? Number(m[1]) : (res.ok ? (await res.json()).length : 0);
  } catch {}
  out.push({
    name: r.name,
    private: r.private,
    url: r.private ? null : r.html_url,
    description: r.description || '',
    homepage: r.homepage || '',
    language: r.language,
    languages,
    topics: r.topics || [],
    stars: r.stargazers_count,
    empty: r.size === 0,
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
    commits,
  });
}

await mkdir('site/data', { recursive: true });
await writeFile('site/data/github.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  user: {
    login: user.login, name: user.name, bio: user.bio, avatar: user.avatar_url,
    location: user.location, htmlUrl: user.html_url,
  },
  repos: out,
}, null, 2));
console.log(`synced ${out.length} repos (${out.filter((r) => r.private).length} private)`);
