// Kılavuz için iPhone boyutunda ekran görüntüleri: node araclar/kilavuz-ekran.mjs
// Önce node araclar/gorsel-onizle.mjs çalışmış olmalı (test/ornek-durum.json). Sunucu 5230'da açık olmalı.
// Çıktılar kilavuz/ekran-*.png (öğretmen adı içerir, depoya gitmez).
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const kok = new URL('../', import.meta.url);
mkdirSync(new URL('kilavuz/', kok), { recursive: true });
const index = readFileSync(new URL('index.html', kok), 'utf8');
const html = index.replace('<script type="module" src="js/app.js"></script>', `<script type="module">
const q = new URLSearchParams(location.search);
const d = await (await fetch('/test/ornek-durum.json')).json();
d.sonYedek = '2026-11-04';
if (q.get('kismi')) d.kayitlar['2026-11-06'].gelmeyenler[1].saatler = [2, 3, 4];
// derssiz: Çarşamba dersi olmayan öğretmen gelmeyen girilmiş
if (q.get('derssiz')) d.kayitlar['2026-11-04'] = { gelmeyenler: [d.kayitlar['2026-11-06'].gelmeyenler[0]], atamalar: [] };
d.imza = { unvan: 'Müdür Yardımcısı', ad: '' };
localStorage.setItem('nobet-gorevlendirme-v1', JSON.stringify(d));
await import('/js/app.js');
const N = window.__nobetci; N.ui.tarih = q.get('tarih') || '2026-11-06'; N.ui.hafta = '2026-11-02'; N.ui.ay = '2026-11';
document.querySelector('#menu-alt [data-sayfa=' + (q.get('sayfa') || 'gorev') + ']').click();
await new Promise((r) => setTimeout(r, 300));
if (q.get('hedef')) {
  const el = document.querySelector(q.get('hedef'));
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
} else window.scrollTo(0, +(q.get('y') || 0));
</script>`).replaceAll('href="', 'href="/').replaceAll('href="/http', 'href="http');
writeFileSync(new URL('test/kilavuz-ekran.html', kok), html);
// başsız tarayıcı pencereyi 390 pikselden dar çizmediği için sayfa 390×844 çerçeve içinde açılır
writeFileSync(new URL('test/kilavuz-cerceve.html', kok), `<!doctype html><html><body style="margin:0;background:#fff">
<iframe id="f" style="border:0;width:390px;height:844px;display:block" src="/test/kilavuz-ekran.html"></iframe>
<script>document.getElementById('f').src = '/test/kilavuz-ekran.html' + location.search;</script></body></html>`);

const tarayici = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync);
const ekranlar = [
  ['gorev-ust', 'sayfa=gorev'],
  ['gorev-liste', 'sayfa=gorev&hedef=.grup-bas'],
  ['nobet', 'sayfa=nobet'],
  ['veri-yedek', 'sayfa=veri&hedef=%23yedek-al'],
  ['veri-ust', 'sayfa=veri'],
  ['kismi', 'sayfa=gorev&kismi=1&hedef=.gelmeyen-kart'],
  ['nobetciler', 'sayfa=gorev&hedef=.nobetci-lejant'],
  ['derssiz', 'sayfa=gorev&derssiz=1&tarih=2026-11-04'],
];
const sadece = process.argv[2];
for (const [ad, sorgu] of ekranlar.filter(([a]) => !sadece || a === sadece)) {
  const hedef = new URL(`kilavuz/ekran-${ad}.png`, kok);
  const gecici = join(tmpdir(), `nb-ekran-${ad}.png`); // Edge boşluklu yola yazamıyor
  if (existsSync(gecici)) rmSync(gecici);
  for (let deneme = 0; deneme < 3 && !existsSync(gecici); deneme++) {
    execFileSync(tarayici, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(tmpdir(), 'nb-k-' + Math.random().toString(36).slice(2))}`,
      '--window-size=700,844', '--force-device-scale-factor=2', '--virtual-time-budget=9000', `--screenshot=${gecici}`,
      `http://localhost:5230/test/kilavuz-cerceve.html?${sorgu}`], { stdio: 'ignore' });
  }
  // sağdaki boşluğu kırp: 390 × 844 (2x = 780 × 1688)
  if (existsSync(gecici)) execFileSync('python', ['-c', `from PIL import Image; Image.open(r"${gecici}").crop((0,0,780,1688)).save(r"${decodeURI(hedef.pathname.slice(1))}")`]);
  console.log(ad, existsSync(gecici) ? 'tamam' : 'BAŞARISIZ');
}
