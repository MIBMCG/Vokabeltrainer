import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['.git', '.worktrees', '.superpowers', 'node_modules', 'test-results', 'playwright-report']);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    if (entry.isFile()) files.push(fullPath);
  }
}

walk(root);
const errors = [];
let localLinks = 0;
const checkedExtensions = /\.(?:css|html|js|json|md|mjs|svg|webmanifest)$/;

for (const file of files.filter((candidate) => checkedExtensions.test(candidate))) {
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
  } catch {
    errors.push(`${path.relative(root, file)}: invalid UTF-8`);
    continue;
  }

  const relativeFile = path.relative(root, file);
  if (source.includes('\r')) errors.push(`${relativeFile}: CR line endings`);
  if (!source.endsWith('\n')) errors.push(`${relativeFile}: missing final newline`);
  if (/^(?:<{7}|={7}|>{7})/m.test(source)) errors.push(`${relativeFile}: merge marker`);
  if (/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}/.test(source)) {
    errors.push(`${relativeFile}: credential-like pattern`);
  }
  if (!file.endsWith('.md')) continue;
  if (/[A-Z]:\\(?:Users|Vokabeltrainer)/.test(source)) errors.push(`${relativeFile}: machine-specific path`);

  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split(' "')[0].replace(/^<|>$/g, '');
    if (/^(?:https?:|mailto:|app:|plugin:)/.test(target)) continue;
    const [name, anchor] = target.split('#');
    const resolved = name ? path.resolve(path.dirname(file), decodeURIComponent(name)) : file;
    localLinks += 1;
    if (!fs.existsSync(resolved)) {
      errors.push(`${relativeFile}: missing ${target}`);
      continue;
    }
    if (anchor && resolved.endsWith('.md')) {
      const headings = [...fs.readFileSync(resolved, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)]
        .map((heading) => heading[1].toLowerCase()
          .replace(/[^\p{L}\p{N}\s_-]/gu, '')
          .trim()
          .replace(/\s/g, '-'));
      if (!headings.includes(decodeURIComponent(anchor))) errors.push(`${relativeFile}: missing anchor ${target}`);
    }
  }
}

for (const required of ['README.md', 'AGENTS.md', 'START-HIER.md', 'ARBEITSSTAND.md', 'docs/ANFORDERUNGEN.md', 'docs/ARCHITEKTUR.md']) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`missing required ${required}`);
}

console.log(JSON.stringify({
  files: files.length,
  markdown: files.filter((file) => file.endsWith('.md')).length,
  localLinks,
  errors,
}, null, 2));
if (errors.length) process.exitCode = 1;
