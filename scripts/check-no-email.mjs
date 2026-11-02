// CI guard (KIT_01 R1, R11; v1.1 30 Oct 2026 adds "Indraprastha Publications"): fails if built HTML/JS/JSON contains an email address, mailto:, or a banned entity name.
import { readdirSync, readFileSync, statSync } from 'node:fs'; import { join } from 'node:path';
const dir = process.argv[2] || 'dist';
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, MAILTO = /mailto:/i;
const BANNED = /(Indraprastha Innovations|Indraprastha Publications|\bIIPL\b|Vedant Enterprises|\bVEPL\b|Telanganam Publications)/i;
const ALLOW = [/@context/, /@id/, /@type/, /@graph/, /@media/, /@font-face/, /@keyframes/, /@supports/, /@import/, /@layer/, /@container/, /@view-transition/];
let bad = 0;
const walk = d => readdirSync(d).forEach(f => { const p = join(d, f);
  if (statSync(p).isDirectory()) return walk(p);
  if (!/\.(html|js|mjs|json|txt|xml|css)$/.test(f)) return;
  const s = readFileSync(p, 'utf8');
  const hits = (s.match(EMAIL) || []).filter(m => !ALLOW.some(a => a.test(m)) && !/\.(png|jpe?g|webp|avif|svg|woff2?)$/i.test(m) && !/^[\w.-]+@\d/.test(m));
  if (hits.length) { console.error(`EMAIL in ${p}: ${[...new Set(hits)].slice(0,3).join(', ')}`); bad++; }
  if (MAILTO.test(s)) { console.error(`mailto: in ${p}`); bad++; }
  if (BANNED.test(s)) { console.error(`Banned entity name in ${p}`); bad++; } });
walk(dir);
if (bad) { console.error(`check-no-email: ${bad} problem(s)`); process.exit(1); } else console.log('check-no-email: OK');
