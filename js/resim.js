// Nöbetçi360 — kurumsal belge görseli (A4 oranlı sayfalar, PNG).
// Paylaşım ve yazdırma aynı sayfaları kullanır. İçerik sığmazsa yeni sayfa açılır.
import { logoIsaret } from './ikonlar.js';

const R = {
  murekkep: '#0E1A2B', murekkep2: '#22314A', murekkep3: '#4A5568',
  soluk: '#77726A', soluk2: '#A39E95', kagit: '#F5F3EE', kagit2: '#EDEAE3', cizgi: '#E6E2D9', cizgi2: '#D8D3C8',
  vurgu: '#D9482B', vurguKoyu: '#B83A20', vurguAcik: '#FBEAE4', yuzey: '#FFFFFF', baslikZemin: '#FAF9F6',
};
export const NEDEN_RENK = {
  Raporlu: ['#FBEAE4', '#B83A20'], Mazeretli: ['#FAF0DD', '#A86A12'], Görevli: ['#E5EDF5', '#2C5A86'],
  İzinli: ['#E4F1EA', '#1F7A55'], Sevkli: ['#EEE7F3', '#6A4C86'],
};
const AVATAR = ['#E8E1D2', '#DCE5EF', '#E7DEEA', '#DCE9E1', '#F0E1D5', '#E1E3EA'];
export function avatarNo(ad) {
  let h = 0;
  for (const c of String(ad)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % AVATAR.length;
}

const F = (k, w = 400) => `${w} ${k}px Plex, -apple-system, "Segoe UI", sans-serif`;
async function fontlarHazir() {
  if (!document.fonts) return;
  await Promise.all([400, 500, 600, 700].map((w) => document.fonts.load(F(16, w), 'ÇĞİÖŞÜçğıöşü09')));
}
function resimYukle(svg) {
  return new Promise((ok) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function kisalt(x, metin, gen) {
  metin = String(metin ?? '');
  if (gen <= 0) return '';
  if (x.measureText(metin).width <= gen) return metin;
  while (metin.length > 1 && x.measureText(metin + '…').width > gen) metin = metin.slice(0, -1);
  return metin.trimEnd() + '…';
}
function yuvarlak(x, a, b, w, h, r) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}
function aralikli(x, metin, a, b, aralik, hiza = 'sol') {
  let w = 0;
  for (const ch of metin) w += x.measureText(ch).width + aralik;
  w -= aralik;
  let cx = hiza === 'sag' ? a - w : hiza === 'orta' ? a - w / 2 : a;
  const eski = x.textAlign; x.textAlign = 'left';
  for (const ch of metin) { x.fillText(ch, cx, b); cx += x.measureText(ch).width + aralik; }
  x.textAlign = eski;
  return w;
}
const BUYUK = (s) => String(s).toLocaleUpperCase('tr-TR');

// ---------------------------------------------------------------------------
// Yerleşim sabitleri
const W = 800;              // mantıksal genişlik
const H = Math.round(W * 1.4142); // A4 oranı
const P = 40;               // kenar boşluğu
const IC = W - P * 2;
const KAPAK1 = 176;         // ilk sayfa kapak bandı (logo + başlık + özet)
const KAPAK2 = 92;          // devam sayfası bandı
const BASLIK1 = KAPAK1 + 26; // içeriğin başladığı yer
const BASLIK2 = KAPAK2 + 26;
const ALT = 70;             // alt bilgi
const BOLUM_H = 44;
const TABLO_BAS = 34;
const NOT_H = 22;

/*
  belge = {
    tur: 'Günlük görevlendirme',          // üst etiket
    baslik: '6 Kasım 2026',               // büyük başlık
    altBaslik: 'Cuma',                    // başlığın yanındaki soluk kısım
    ozet: [{ deger: 1, etiket: 'gelmeyen' }],
    okul, imza: { unvan, ad },
    bloklar: [
      { tur: 'bolum', baslik: 'Gelmeyen öğretmenler', meta: '1 kişi' },
      { tur: 'tablo', satirH: 34, sutunlar: [{ baslik, alt, gen, tur, hiza }], satirlar: [[...hucreler]] },
      { tur: 'notlar', liste: ['...'] },
    ],
  }
  Hücre türleri: metin | kalin | soluk | kisi {ad, bas, bos} | rozet {metin, neden} | sinif (metin|null|{metin,acik}) | sayi | cubuk {s,o,max}
*/
export async function belgeSayfalari(belge, olcek = 2.4) {
  await fontlarHazir();
  const logo = await resimYukle(logoIsaret({ boyut: 64 }));
  const logoSeffaf = await resimYukle(logoIsaret({ boyut: 64, zemin: false }));

  // ---- 1) sayfalara böl (yükseklik hesabı)
  const sayfalar = [[]];
  let y = BASLIK1;
  const sinir = () => H - ALT - 12;
  const yeniSayfa = () => { sayfalar.push([]); y = BASLIK2; };
  for (const b of belge.bloklar) {
    if (b.tur === 'bolum') {
      if (y + BOLUM_H + 52 + 40 > sinir()) yeniSayfa();
      sayfalar.at(-1).push({ ...b, y }); y += BOLUM_H;
    } else if (b.tur === 'tablo') {
      const sh = b.satirH || 34;
      let parca = { ...b, satirlar: [], y };
      y += basYuk(b);
      for (const s of b.satirlar) {
        if (y + sh > sinir()) {
          if (parca.satirlar.length) { parca.h = y - parca.y; sayfalar.at(-1).push(parca); }
          yeniSayfa();
          sayfalar.at(-1).push({ tur: 'bolum', baslik: (b.devamBaslik || 'Devamı'), y }); y += BOLUM_H;
          parca = { ...b, satirlar: [], y }; y += basYuk(b);
        }
        parca.satirlar.push(s); y += sh;
      }
      parca.h = y - parca.y; sayfalar.at(-1).push(parca);
      y += 22;
    } else if (b.tur === 'notlar' && b.liste.length) {
      const nh = b.liste.length * NOT_H + 6;
      if (y + nh > sinir()) yeniSayfa();
      sayfalar.at(-1).push({ ...b, y }); y += nh + 10;
    }
  }

  // ---- 2) çiz
  const toplam = sayfalar.length;
  const bloblar = [];
  for (let si = 0; si < toplam; si++) {
    // tek sayfalık belge içeriğe göre kısalır (paylaşımda boş alan kalmasın); çok sayfalıda A4 korunur
    const sh = toplam === 1 ? Math.min(H, Math.max(Math.round(W * 0.7), y + ALT + 4)) : H;
    const c = document.createElement('canvas');
    c.width = Math.round(W * olcek); c.height = Math.round(sh * olcek);
    const x = c.getContext('2d');
    x.scale(olcek, olcek);
    x.textBaseline = 'middle';
    x.fillStyle = R.kagit; x.fillRect(0, 0, W, sh);
    banta(x, belge, logoSeffaf, si === 0, si + 1, toplam);
    for (const b of sayfalar[si]) {
      if (b.tur === 'bolum') bolumCiz(x, b);
      else if (b.tur === 'tablo') tabloCiz(x, b);
      else if (b.tur === 'notlar') notCiz(x, b);
    }
    altBilgi(x, belge, logo, si + 1, toplam, sh);
    bloblar.push(await new Promise((ok) => c.toBlob(ok, 'image/png')));
  }
  return bloblar;
}

// Kapak bandı: renk geçişi + kiremit ışıma + logodaki 8 dilimli halka filigranı + ince nokta dokusu
function kapakZemini(x, h) {
  // çapraz renk geçişi
  const g = x.createLinearGradient(0, 0, W, h);
  g.addColorStop(0, '#0B1524'); g.addColorStop(0.55, '#15253D'); g.addColorStop(1, '#22385A');
  x.fillStyle = g; x.fillRect(0, 0, W, h);
  x.save();
  x.beginPath(); x.rect(0, 0, W, h); x.clip();
  // sağ üstte kiremit ışıma
  const r1 = x.createRadialGradient(W - 90, -10, 0, W - 90, -10, 340);
  r1.addColorStop(0, 'rgba(217,72,43,0.38)'); r1.addColorStop(0.45, 'rgba(217,72,43,0.10)'); r1.addColorStop(1, 'rgba(217,72,43,0)');
  x.fillStyle = r1; x.fillRect(0, 0, W, h);
  // sol altta soğuk ışıma
  const r2 = x.createRadialGradient(80, h + 40, 0, 80, h + 40, 300);
  r2.addColorStop(0, 'rgba(90,130,190,0.20)'); r2.addColorStop(1, 'rgba(90,130,190,0)');
  x.fillStyle = r2; x.fillRect(0, 0, W, h);
  // nokta dokusu
  x.fillStyle = 'rgba(255,255,255,0.05)';
  for (let yy = 8; yy < h; yy += 14) for (let xx = 8 + ((yy / 14) % 2) * 7; xx < W; xx += 14) x.fillRect(xx, yy, 1.2, 1.2);
  // logo halkası filigranı (sağda, kırpık)
  const cx = W - 120, cy = h * 0.55, rr = Math.max(118, h * 0.78);
  for (let i = 0; i < 8; i++) {
    const a0 = ((-90 + i * 45 + 5) * Math.PI) / 180, a1 = ((-90 + i * 45 + 40) * Math.PI) / 180;
    x.beginPath(); x.arc(cx, cy, rr, a0, a1);
    x.strokeStyle = i === 0 ? 'rgba(217,72,43,0.55)' : `rgba(255,255,255,${i >= 6 ? 0.10 : 0.05})`;
    x.lineWidth = 16; x.stroke();
  }
  // iç ince halka
  x.beginPath(); x.arc(cx, cy, rr - 26, 0, Math.PI * 2); x.strokeStyle = 'rgba(255,255,255,0.05)'; x.lineWidth = 1; x.stroke();
  x.restore();
  // alt kenar: kiremit vurgu + ince ışık çizgisi
  const cz = x.createLinearGradient(0, 0, W, 0);
  cz.addColorStop(0, 'rgba(255,255,255,0.0)'); cz.addColorStop(0.5, 'rgba(255,255,255,0.18)'); cz.addColorStop(1, 'rgba(255,255,255,0.0)');
  x.fillStyle = cz; x.fillRect(0, h - 1, W, 1);
  x.fillStyle = R.vurgu; x.fillRect(0, h, 120, 3);
}

// Marka: koyu bantta kaybolmasın diye logo, açık kenarlı kendi karesi içinde; yazı 17 pt, "360" açık kiremit
function markaYaz(x, logo, y) {
  const k = 36, kx = P, ky = y - k / 2;
  // altından sızan neon ışık: karenin altında yayılıp sönen kiremit hale
  x.save();
  x.translate(kx + k / 2, ky + k);
  x.scale(1.7, 0.75);
  const hale = x.createRadialGradient(0, 0, 0, 0, 0, 30);
  hale.addColorStop(0, 'rgba(255,110,80,0.55)');
  hale.addColorStop(0.45, 'rgba(240,90,60,0.22)');
  hale.addColorStop(1, 'rgba(217,72,43,0)');
  x.fillStyle = hale; x.beginPath(); x.arc(0, 0, 30, 0, Math.PI * 2); x.fill();
  x.restore();
  x.save();
  x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 8; x.shadowOffsetY = 2;
  yuvarlak(x, kx, ky, k, k, 9);
  const z = x.createLinearGradient(kx, ky, kx + k, ky + k);
  z.addColorStop(0, '#24395A'); z.addColorStop(1, '#13223A');
  x.fillStyle = z; x.fill();
  x.restore();
  yuvarlak(x, kx + 0.5, ky + 0.5, k - 1, k - 1, 9); x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 1; x.stroke();
  // alt kenarda ince neon çizgi (ortada parlak, uçlarda sönen)
  x.save();
  const cz = x.createLinearGradient(kx + 4, 0, kx + k - 4, 0);
  cz.addColorStop(0, 'rgba(255,120,90,0)'); cz.addColorStop(0.5, 'rgba(255,150,120,0.95)'); cz.addColorStop(1, 'rgba(255,120,90,0)');
  x.shadowColor = 'rgba(255,90,60,0.9)'; x.shadowBlur = 6;
  x.fillStyle = cz; x.fillRect(kx + 4, ky + k - 1.2, k - 8, 1.4);
  x.restore();
  if (logo) x.drawImage(logo, kx + 1, ky + 1, k - 2, k - 2);
  x.textAlign = 'left';
  x.font = F(17, 600); x.fillStyle = '#fff'; x.fillText('Nöbetçi', kx + k + 11, y + 0.5);
  const nw = x.measureText('Nöbetçi').width;
  x.font = F(17, 700); x.fillStyle = '#EE6A4F'; x.fillText('360', kx + k + 11 + nw + 1, y + 0.5);
}

// Okul adı rozeti: yarı saydam kapsül + kalkan simgesi + sıcak tonlu geçişli yazı
function okulRozeti(x, okul, sagX, cy, boyut = 12.5) {
  x.font = F(boyut, 600);
  const ad = kisalt(x, okul, IC * 0.5);
  const tw = x.measureText(ad).width;
  const h = boyut + 17, ikonW = 14, w = tw + ikonW + 34;
  const sol = sagX - w, ust = cy - h / 2;
  // kapsül: hafif ışıma + cam zemin + ince kenar
  x.save();
  x.shadowColor = 'rgba(217,72,43,0.35)'; x.shadowBlur = 18;
  yuvarlak(x, sol, ust, w, h, h / 2);
  const z = x.createLinearGradient(sol, ust, sol + w, ust + h);
  z.addColorStop(0, 'rgba(255,255,255,0.13)'); z.addColorStop(1, 'rgba(255,255,255,0.04)');
  x.fillStyle = z; x.fill();
  x.restore();
  yuvarlak(x, sol + 0.5, ust + 0.5, w - 1, h - 1, h / 2);
  const k = x.createLinearGradient(sol, ust, sol + w, ust);
  k.addColorStop(0, 'rgba(240,160,143,0.55)'); k.addColorStop(1, 'rgba(255,255,255,0.14)');
  x.strokeStyle = k; x.lineWidth = 1; x.stroke();
  // kalkan simgesi
  const ix = sol + 14, iy = cy;
  x.beginPath();
  x.moveTo(ix + 7, iy - 7.5); x.lineTo(ix + 13, iy - 5); x.lineTo(ix + 13, iy - 0.5);
  x.quadraticCurveTo(ix + 13, iy + 5.5, ix + 7, iy + 8); x.quadraticCurveTo(ix + 1, iy + 5.5, ix + 1, iy - 0.5);
  x.lineTo(ix + 1, iy - 5); x.closePath();
  x.fillStyle = R.vurgu; x.fill();
  x.beginPath(); x.moveTo(ix + 4.3, iy + 0.2); x.lineTo(ix + 6.3, iy + 2.3); x.lineTo(ix + 9.8, iy - 2);
  x.strokeStyle = '#fff'; x.lineWidth = 1.4; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); x.lineCap = 'butt';
  // geçişli yazı
  const tx = ix + ikonW + 8;
  const yg = x.createLinearGradient(tx, 0, tx + tw, 0);
  yg.addColorStop(0, '#FFFFFF'); yg.addColorStop(1, '#F6CDBF');
  x.font = F(boyut, 600); x.fillStyle = yg; x.textAlign = 'left';
  x.fillText(ad, tx, cy + 0.5);
}

function banta(x, belge, logo, ilk, no, toplam) {
  if (ilk) {
    kapakZemini(x, KAPAK1);
    markaYaz(x, logo, 38);
    if (belge.okul) okulRozeti(x, belge.okul, W - P, 38);
    // ince ayraç
    x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(P, 66, IC, 1);
    // başlık
    x.font = F(10.5, 600); x.fillStyle = '#F0A08F';
    aralikli(x, BUYUK(belge.tur), P, 92, 1.6);
    x.font = F(30, 600); x.fillStyle = '#fff'; x.fillText(belge.baslik, P, 128);
    if (belge.altBaslik) {
      const bw = x.measureText(belge.baslik).width;
      x.font = F(30, 300); x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillText(belge.altBaslik, P + bw + 10, 128);
    }
    // özet sayılar: yarı saydam cam kutucuklar
    if (belge.ozet?.length) {
      let sx = W - P;
      const kh = 60, ky = 92;
      for (const o of [...belge.ozet].reverse()) {
        x.font = F(9.5, 600); let ew = 0; for (const ch of BUYUK(o.etiket)) ew += x.measureText(ch).width + 1;
        x.font = F(24, 600); const dw = x.measureText(String(o.deger)).width;
        const kw = Math.max(ew, dw) + 28;
        yuvarlak(x, sx - kw, ky, kw, kh, 10);
        x.fillStyle = 'rgba(255,255,255,0.07)'; x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1; x.stroke();
        x.textAlign = 'center';
        x.font = F(24, 600); x.fillStyle = o.renk ? '#FF8A70' : '#fff'; x.fillText(String(o.deger), sx - kw / 2, ky + 24);
        x.font = F(9.5, 600); x.fillStyle = 'rgba(255,255,255,0.6)';
        aralikli(x, BUYUK(o.etiket), sx - kw / 2, ky + 46, 1, 'orta');
        x.textAlign = 'left';
        sx -= kw + 8;
      }
    }
  } else {
    kapakZemini(x, KAPAK2);
    markaYaz(x, logo, 30);
    if (belge.okul) okulRozeti(x, belge.okul, W - P, 30, 11.5);
    x.textAlign = 'right'; x.font = F(11.5, 600); x.fillStyle = 'rgba(255,255,255,0.7)';
    x.fillText(`Sayfa ${no}/${toplam}`, W - P, 66); x.textAlign = 'left';
    x.font = F(15, 600); x.fillStyle = '#fff'; x.fillText(belge.baslik, P, 66);
    const bw = x.measureText(belge.baslik).width;
    x.font = F(15, 400); x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillText(`${belge.altBaslik ? belge.altBaslik + ' · ' : ''}devam`, P + bw + 8, 66);
  }
}

// Bölüm başlığı: kiremit işaret çubuğu + koyu, büyük başlık
function bolumCiz(x, b) {
  const yy = b.y + BOLUM_H / 2 + 1;
  yuvarlak(x, P, yy - 10, 4, 20, 2); x.fillStyle = R.vurgu; x.fill();
  x.font = F(16, 700); x.fillStyle = R.murekkep; x.textAlign = 'left';
  x.fillText(b.baslik, P + 14, yy);
  const w = x.measureText(b.baslik).width + 14;
  let mw = 0;
  if (b.meta) {
    x.font = F(11.5, 500); mw = x.measureText(b.meta).width + 14;
    x.fillStyle = R.soluk; x.textAlign = 'right'; x.fillText(b.meta, W - P, yy); x.textAlign = 'left';
  }
  x.fillStyle = R.cizgi2; x.fillRect(P + w + 14, yy, IC - w - 14 - mw, 1);
}

const basYuk = (b) => (b.sutunlar.some((s) => s.alt) ? 52 : 36);

function sutunlar(b) {
  const top = b.sutunlar.reduce((t, s) => t + s.gen, 0);
  let kx = P;
  return b.sutunlar.map((s) => { const g = (IC * s.gen) / top; const k = { ...s, x: kx, g }; kx += g; return k; });
}

function tabloCiz(x, b) {
  const kol = sutunlar(b);
  const sh = b.satirH || 34;
  const top = b.y, h = b.h;
  const BH = basYuk(b);
  // kart
  yuvarlak(x, P, top, IC, h, 10); x.fillStyle = R.yuzey; x.fill();
  x.save(); yuvarlak(x, P, top, IC, h, 10); x.clip();
  x.fillStyle = '#F1EEE7'; x.fillRect(P, top, IC, BH);
  // vurgulu sütun (ör. nöbet alanı): hafif tonlu zemin
  for (const k of kol) if (k.vurgulu) { x.fillStyle = '#F8F6F1'; x.fillRect(k.x, top + BH, k.g, h - BH); }
  x.restore();
  yuvarlak(x, P + 0.5, top + 0.5, IC - 1, h - 1, 10); x.strokeStyle = R.cizgi2; x.lineWidth = 1; x.stroke();
  x.fillStyle = R.cizgi2; x.fillRect(P, top + BH - 1, IC, 1);
  // başlıklar
  for (const k of kol) {
    const hiza = k.hiza || 'sol';
    const tx = hiza === 'sag' ? k.x + k.g - 12 : hiza === 'orta' ? k.x + k.g / 2 : k.x + 14;
    if (k.alt && k.tur === 'sinif') {
      // ders saati: koyu rozet içinde numara + altında saat
      x.font = F(13, 700); const nw = Math.max(x.measureText(k.baslik).width + 14, 26);
      yuvarlak(x, tx - nw / 2, top + 8, nw, 22, 6); x.fillStyle = R.murekkep; x.fill();
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(k.baslik, tx, top + 19.5);
      x.font = F(10.5, 600); x.fillStyle = R.murekkep3; x.fillText(k.alt, tx, top + 41);
      x.textAlign = 'left';
    } else if (k.alt) {
      // gün + tarih
      x.textAlign = hiza === 'orta' ? 'center' : hiza === 'sag' ? 'right' : 'left';
      x.font = F(14, 700); x.fillStyle = R.murekkep; x.fillText(k.baslik, tx, top + 19);
      x.font = F(11, 600); x.fillStyle = R.vurguKoyu; x.fillText(k.alt, tx, top + 37);
      x.textAlign = 'left';
    } else {
      x.font = F(10, 700); x.fillStyle = R.murekkep3;
      aralikli(x, BUYUK(k.baslik), tx, top + BH / 2, 1.1, hiza);
    }
  }
  // dikey ayraç
  if (b.dikeyCizgi) {
    x.fillStyle = R.cizgi;
    for (const k of kol.slice(b.dikeyCizgi)) x.fillRect(k.x, top + BH, 1, h - BH - 6);
  }
  let y = top + BH;
  b.satirlar.forEach((s, ri) => {
    if (ri) { x.fillStyle = R.cizgi; x.fillRect(P + 12, y, IC - 24, 1); }
    const my = y + sh / 2;
    s.forEach((h2, i) => hucre(x, kol[i], h2, my, sh));
    y += sh;
  });
}

function hucre(x, k, h, my, sh) {
  if (h == null || h === '') return;
  const hiza = k.hiza || 'sol';
  const sol = k.x + 14; const gen = k.g - 24;
  switch (k.tur) {
    case 'kisi': {
      const r = 12; const ax = sol + r;
      if (h.bos) {
        x.setLineDash([2.5, 2.5]); x.beginPath(); x.arc(ax, my, r - 0.5, 0, Math.PI * 2); x.strokeStyle = R.vurgu; x.lineWidth = 1.3; x.stroke(); x.setLineDash([]);
        x.font = F(12.5, 600); x.fillStyle = R.vurguKoyu; x.fillText(kisalt(x, h.ad || 'Görevli bulunamadı', gen - 2 * r - 8), sol + 2 * r + 9, my);
      } else {
        x.beginPath(); x.arc(ax, my, r, 0, Math.PI * 2); x.fillStyle = AVATAR[avatarNo(h.ad)]; x.fill();
        x.font = F(9.5, 700); x.fillStyle = R.murekkep2; x.textAlign = 'center'; x.fillText(h.bas || '', ax, my + 0.5); x.textAlign = 'left';
        x.font = F(13, 600); x.fillStyle = R.murekkep; x.fillText(kisalt(x, h.ad, gen - 2 * r - 8), sol + 2 * r + 9, my - (h.alt ? 7 : 0));
        if (h.alt) { x.font = F(10.5, 400); x.fillStyle = R.soluk; x.fillText(kisalt(x, h.alt, gen - 2 * r - 8), sol + 2 * r + 9, my + 8); }
      }
      break;
    }
    case 'rozet': {
      const [zemin, yazi] = NEDEN_RENK[h.neden || h.metin] || [R.kagit2, R.murekkep3];
      x.font = F(11, 600); const tw = x.measureText(h.metin).width + 18;
      yuvarlak(x, sol, my - 10, tw, 20, 10); x.fillStyle = zemin; x.fill();
      x.fillStyle = yazi; x.fillText(h.metin, sol + 9, my + 0.5);
      break;
    }
    case 'sinif': {
      if (h === 0) { // boş saat: silik nokta
        x.fillStyle = R.cizgi2; x.beginPath(); x.arc(k.x + k.g / 2, my, 1.6, 0, Math.PI * 2); x.fill();
        break;
      }
      const m = typeof h === 'object' ? h.metin : h;
      const acik = typeof h === 'object' && h.acik;
      x.font = F(12, 700);
      const tw = Math.min(Math.max(x.measureText(m).width + 14, 42), k.g - 8);
      const cx = k.x + k.g / 2;
      yuvarlak(x, cx - tw / 2, my - 11, tw, 22, 6);
      if (acik) { x.fillStyle = R.vurguAcik; x.fill(); x.strokeStyle = R.vurgu; }
      else { x.fillStyle = R.murekkep; x.fill(); x.strokeStyle = R.murekkep; }
      x.lineWidth = 1; x.stroke();
      x.fillStyle = acik ? R.vurguKoyu : '#fff'; x.textAlign = 'center';
      x.fillText(kisalt(x, m, tw - 8), cx, my + 0.5); x.textAlign = 'left';
      break;
    }
    case 'saatSinif': {
      // her ders bir kutucuk: koyu saat numarası + sınıf; sığmazsa ikinci satıra iner
      if (!Array.isArray(h)) { x.font = F(12, 400); x.fillStyle = R.soluk2; x.fillText(String(h), sol, my); break; }
      const ch = 22, ara = 5;
      x.font = F(11.5, 700);
      const olc = h.map((d) => { x.font = F(11.5, 700); const nw = x.measureText(String(d.saat)).width; x.font = F(11.5, 600); return { ...d, nw, w: nw + x.measureText(d.sinif).width + 24 }; });
      const satirlar = [[]]; let sw = 0;
      for (const d of olc) { if (sw + d.w > gen + 10 && satirlar.at(-1).length) { satirlar.push([]); sw = 0; } satirlar.at(-1).push(d); sw += d.w + ara; }
      const top = my - (satirlar.length * ch + (satirlar.length - 1) * ara) / 2;
      satirlar.forEach((sat, si) => {
        let cx = sol; const cy = top + si * (ch + ara);
        for (const d of sat) {
          yuvarlak(x, cx, cy, d.w, ch, 6); x.fillStyle = '#F1EEE7'; x.fill();
          x.strokeStyle = R.cizgi2; x.lineWidth = 1; x.stroke();
          // saat numarası koyu kare içinde
          yuvarlak(x, cx + 2, cy + 2, d.nw + 10, ch - 4, 4); x.fillStyle = R.murekkep; x.fill();
          x.font = F(11.5, 700); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(String(d.saat), cx + 2 + (d.nw + 10) / 2, cy + ch / 2 + 0.5);
          x.font = F(11.5, 600); x.fillStyle = R.murekkep; x.textAlign = 'left'; x.fillText(d.sinif, cx + d.nw + 17, cy + ch / 2 + 0.5);
          cx += d.w + ara;
        }
      });
      break;
    }
    case 'bosluk': {
      x.fillStyle = R.cizgi2; x.beginPath(); x.arc(k.x + k.g / 2, my, 1.6, 0, Math.PI * 2); x.fill();
      break;
    }
    case 'sayi': {
      x.font = F(13, 600); x.fillStyle = h === 0 || h === '0' ? R.soluk2 : R.murekkep;
      x.textAlign = hiza === 'orta' ? 'center' : 'right';
      x.fillText(String(h), hiza === 'orta' ? k.x + k.g / 2 : k.x + k.g - 12, my); x.textAlign = 'left';
      break;
    }
    case 'cubuk': {
      const bw = gen;
      yuvarlak(x, sol, my - 3.5, bw, 7, 3.5); x.fillStyle = R.kagit2; x.fill();
      x.save(); yuvarlak(x, sol, my - 3.5, bw, 7, 3.5); x.clip();
      x.fillStyle = R.murekkep; x.fillRect(sol, my - 3.5, (bw * h.s) / h.max, 7);
      x.fillStyle = R.vurgu; x.fillRect(sol + (bw * h.s) / h.max, my - 3.5, (bw * h.o) / h.max, 7);
      x.restore();
      break;
    }
    case 'soluk': {
      x.font = F(12, 400); x.fillStyle = R.soluk;
      x.fillText(kisalt(x, h, gen), sol, my);
      break;
    }
    case 'kalin': {
      if (k.vurgulu) {
        yuvarlak(x, sol, my - 7, 3, 14, 1.5); x.fillStyle = R.vurgu; x.fill();
        let boy = 13.5; x.font = F(boy, 700);
        while (boy > 11 && x.measureText(String(h)).width > gen - 10) { boy -= 0.5; x.font = F(boy, 700); }
        x.fillStyle = R.murekkep;
        x.fillText(kisalt(x, h, gen - 10), sol + 10, my);
      } else {
        x.font = F(13, 600); x.fillStyle = R.murekkep;
        x.fillText(kisalt(x, h, gen), sol, my);
      }
      break;
    }
    default: {
      const t = typeof h === 'object' ? h.metin : h;
      const kalin = typeof h === 'object' && h.kalin ? 600 : 400;
      const sigan = hiza === 'orta' ? k.g - 10 : gen;
      // sığmayan metni önce küçült (12.5 → 10.5), sonra gerekirse kısalt
      let boy = 12.5;
      x.font = F(boy, kalin);
      while (boy > 10.5 && x.measureText(String(t)).width > sigan) { boy -= 0.5; x.font = F(boy, kalin); }
      x.fillStyle = t === '—' ? R.soluk2 : R.murekkep;
      const metin = String(t);
      // hâlâ sığmıyorsa ve satır yeterince yüksekse iki satıra böl
      if (x.measureText(metin).width > sigan && sh >= 40 && metin.includes(' ')) {
        const p = metin.split(' ');
        let en = 1, fark = Infinity;
        for (let i = 1; i < p.length; i++) {
          const d = Math.abs(x.measureText(p.slice(0, i).join(' ')).width - x.measureText(p.slice(i).join(' ')).width);
          if (d < fark) { fark = d; en = i; }
        }
        x.font = F(11.5, kalin);
        const s1 = kisalt(x, p.slice(0, en).join(' '), sigan), s2 = kisalt(x, p.slice(en).join(' '), sigan);
        const ax = hiza === 'orta' ? k.x + k.g / 2 : sol;
        x.textAlign = hiza === 'orta' ? 'center' : 'left';
        x.fillText(s1, ax, my - 7); x.fillText(s2, ax, my + 8);
        x.textAlign = 'left';
      } else if (hiza === 'orta') { x.textAlign = 'center'; x.fillText(kisalt(x, metin, sigan), k.x + k.g / 2, my); x.textAlign = 'left'; }
      else x.fillText(kisalt(x, metin, gen), sol, my);
    }
  }
}

function notCiz(x, b) {
  let y = b.y + 4;
  for (const n of b.liste) {
    x.fillStyle = R.vurgu; x.beginPath(); x.arc(P + 4, y + NOT_H / 2, 2.6, 0, Math.PI * 2); x.fill();
    x.font = F(12, 500); x.fillStyle = '#6E4A10'; x.fillText(kisalt(x, n, IC - 16), P + 14, y + NOT_H / 2);
    y += NOT_H;
  }
}

function altBilgi(x, belge, logo, no, toplam, sh = H) {
  const y = sh - ALT;
  x.fillStyle = R.cizgi2; x.fillRect(P, y, IC, 1);
  const zaman = new Date();
  const z = `${zaman.toLocaleDateString('tr-TR')} ${zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  if (logo) x.drawImage(logo, P, y + 18, 18, 18);
  x.font = F(11.5, 600); x.fillStyle = R.murekkep3; x.fillText('Nöbetçi360', P + 25, y + 27);
  x.font = F(10.5, 500); x.fillStyle = R.soluk2; x.fillText(`Hazırlanma ${z}${toplam > 1 ? ` · Sayfa ${no}/${toplam}` : ''}`, P, y + 50);
  if (belge.imza && belge.imza.ad) {
    x.textAlign = 'center';
    x.font = F(13.5, 600); const aw = Math.max(x.measureText(belge.imza.ad).width, 140);
    const mx = W - P - aw / 2;
    x.fillStyle = R.murekkep; x.fillText(belge.imza.ad, mx, y + 27);
    x.font = F(11, 500); x.fillStyle = R.soluk; x.fillText(belge.imza.unvan || 'Müdür Yardımcısı', mx, y + 46);
    x.textAlign = 'left';
  }
}
