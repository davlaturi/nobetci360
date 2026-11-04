// Uygulama simgelerini (PNG) logodan üretir: node araclar/ikon-yaz.mjs
// Windows'taki Edge'i başsız modda kullanır; ek paket gerekmez.
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { logoIsaret } from '../js/ikonlar.js';

const adaylar = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
const tarayici = adaylar.find(existsSync);
if (!tarayici) throw new Error('Edge/Chrome bulunamadı');

const gecici = mkdtempSync(join(tmpdir(), 'nobetci-ikon-'));
for (const s of [180, 192, 512]) {
  const html = join(gecici, `i${s}.html`);
  writeFileSync(html, `<!doctype html><html><body style="margin:0;background:#0E1A2B">${logoIsaret({ boyut: s, rx: 0 }).replace('class="logo-isaret"', 'style="display:block"')}</body></html>`);
  const cikti = new URL(`../ikon/ikon-${s}.png`, import.meta.url);
  execFileSync(tarayici, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(gecici, 'profil')}`,
    `--window-size=${s},${s}`, '--force-device-scale-factor=1', `--screenshot=${decodeURI(cikti.pathname.slice(1))}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore' });
  console.log('ikon', s, 'yazıldı');
}
