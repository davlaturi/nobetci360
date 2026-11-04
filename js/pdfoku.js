// e-Okul PDF okuyucuları — tarayıcıda ve Node'da aynı kod çalışır.
// Girdi: her sayfa için [{x, y, w, str}] (y yukarıdan aşağı), çıktı: düz veri.

export const GUNLER = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA'];

export function buyukHarf(s) {
  return String(s || '').replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}
function gunNorm(s) {
  return buyukHarf(s).replace(/\s+/g, '').replace('ÇARSAMBA', 'ÇARŞAMBA');
}

// PDF.js sayfasından konumlu metin parçaları
export async function sayfaParcalari(page) {
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const out = [];
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const [, , , , x, y] = it.transform;
    const h = Math.abs(it.transform[3]) || it.height || 6;
    out.push({ x, y: vp.height - y - h, w: it.width, h, str: it.str });
  }
  return out;
}

export async function pdfParcalari(pdfjs, veri) {
  const doc = await pdfjs.getDocument({ data: veri, isEvalSupported: false }).promise;
  const sayfalar = [];
  for (let i = 1; i <= doc.numPages; i++) {
    sayfalar.push(await sayfaParcalari(await doc.getPage(i)));
  }
  return sayfalar;
}

// Parçaları satırlara, satır içinde yakın parçaları öbeklere birleştirir.
export function satirlar(parcalar, yTol = 3) {
  const s = [...parcalar].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  for (const p of s) {
    const r = rows.find((r) => Math.abs(r.y - p.y) <= yTol);
    if (r) r.items.push(p); else rows.push({ y: p.y, items: [p] });
  }
  for (const r of rows) {
    r.items.sort((a, b) => a.x - b.x);
    const obek = [];
    for (const p of r.items) {
      const son = obek[obek.length - 1];
      if (son && p.x - (son.x + son.w) < 6) {
        const bosluk = p.x - (son.x + son.w) > 0.8 && !son.str.endsWith(' ') && !p.str.startsWith(' ') ? ' ' : '';
        son.str += bosluk + p.str;
        son.w = p.x + p.w - son.x;
      } else obek.push({ ...p });
    }
    r.obek = obek.map((o) => ({ ...o, str: o.str.replace(/\s+/g, ' ').trim(), cx: o.x + o.w / 2 })).filter((o) => o.str);
    r.metin = r.obek.map((o) => o.str).join(' ');
  }
  return rows.sort((a, b) => a.y - b.y);
}

function enYakin(merkezler, x) {
  let en = 0;
  for (let i = 1; i < merkezler.length; i++) if (Math.abs(merkezler[i] - x) < Math.abs(merkezler[en] - x)) en = i;
  return en;
}

const DERS_RE = /(.+?)\s*<->\s*[^-]*?-\s*(\d+)\s*\.\s*Sınıf\s*\/\s*([A-ZÇĞİÖŞÜ0-9]+)\s*Şubesi/gi;

export function hucreCoz(metin) {
  const t = metin.replace(/\s+/g, ' ').trim();
  if (!t) return [];
  const sonuc = [];
  let m;
  DERS_RE.lastIndex = 0;
  while ((m = DERS_RE.exec(t))) {
    sonuc.push({ ders: m[1].trim().replace(/^[,;]\s*/, ''), sinif: `${m[2]}-${m[3].toUpperCase()}` });
  }
  if (!sonuc.length) sonuc.push({ ders: t, sinif: '' });
  return sonuc;
}

// Öğretmen haftalık ders programı (e-Okul, öğretmen başına bir sayfa)
export function dersProgramiCoz(sayfalar) {
  const ogretmenler = [];
  const uyarilar = [];
  let saatler = null;
  let okul = '';
  sayfalar.forEach((parcalar, si) => {
    const rows = satirlar(parcalar);
    const tum = rows.map((r) => r.metin).join('\n');
    const adM = tum.match(/Adı Soyadı\s*:\s*(.+?)(?:\s{2,}|\s+\d{4}-\d{4}|\s+Branşı|\n|$)/);
    const brM = tum.match(/Branşı\s*:\s*(.+?)(?:\n|$)/);
    if (!adM) { uyarilar.push(`${si + 1}. sayfada öğretmen adı bulunamadı`); return; }
    const ad = adM[1].trim();
    if (!okul) {
      const om = tum.match(/^(?:.*\/\s*)?(.+?)\s+Müdürlüğü\s*$/m);
      if (om) okul = om[1].trim();
    }
    // gün başlıkları
    const basliklar = [];
    for (const r of rows) for (const o of r.obek) {
      const g = GUNLER.indexOf(gunNorm(o.str));
      if (g >= 0 && !basliklar[g]) basliklar[g] = { cx: o.cx, y: r.y };
    }
    if (basliklar.filter(Boolean).length < 5) { uyarilar.push(`${ad}: gün başlıkları okunamadı`); return; }
    const merkezler = basliklar.map((b) => b.cx);
    const solSinir = merkezler[0] - (merkezler[1] - merkezler[0]) / 2;
    // saat satırları
    const saatSat = [];
    for (const r of rows) for (const o of r.obek) {
      if (o.cx < solSinir && /^\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}$/.test(o.str)) saatSat.push({ y: r.y, str: o.str.replace(/\s/g, '') });
    }
    if (saatSat.length < 1) { uyarilar.push(`${ad}: ders saatleri okunamadı`); return; }
    if (!saatler) saatler = saatSat.map((s) => s.str);
    const altSinirRow = rows.find((r) => /Varsa Öğretmenin|OKUL MÜDÜRÜ/i.test(r.metin) && r.y > saatSat[saatSat.length - 1].y);
    const altSinir = altSinirRow ? altSinirRow.y - 1 : saatSat[saatSat.length - 1].y + 25;
    const hucre = {}; // "g-s" -> [{y,x,str}]
    for (const r of rows) {
      if (r.y < saatSat[0].y - 2 || r.y >= altSinir) continue;
      let s = -1;
      for (let i = 0; i < saatSat.length; i++) if (r.y >= saatSat[i].y - 2) s = i;
      if (s < 0) continue;
      for (const o of r.obek) {
        if (o.cx < solSinir) continue;
        const g = enYakin(merkezler, o.cx);
        (hucre[`${g + 1}-${s + 1}`] ||= []).push(o);
      }
    }
    const program = {};
    for (const [k, parc] of Object.entries(hucre)) {
      const metin = parc.sort((a, b) => a.y - b.y || a.x - b.x).map((p) => p.str).join(' ');
      const dersler = hucreCoz(metin);
      if (dersler.length) program[k] = dersler;
    }
    ogretmenler.push({ ad, brans: brM ? brM[1].trim() : '', program });
  });
  return { ogretmenler, saatler, okul, uyarilar };
}

// Nöbet çizelgesi (tarih satırları × alan sütunları)
const TARIH_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

export function nobetCizelgesiCoz(sayfalar) {
  const satirListesi = []; // {tarih:'YYYY-MM-DD', alanlar:{alanAdi: ogretmen}, tatil}
  let alanlar = null;
  const uyarilar = [];
  for (const parcalar of sayfalar) {
    const rows = satirlar(parcalar);
    const tarihSatirlari = rows.filter((r) => r.obek.some((o) => TARIH_RE.test(o.str)));
    if (!tarihSatirlari.length) continue;
    const ilkY = tarihSatirlari[0].y;
    const ust = rows.filter((r) => r.y < ilkY && r.obek.length >= 3);
    if (!ust.length) { uyarilar.push('Alan başlıkları bulunamadı'); continue; }
    const bas = ust[ust.length - 1];
    const sutunlar = bas.obek.filter((o) => !/^(Tatil|Tarih)$/i.test(o.str));
    const tatilSut = bas.obek.find((o) => /^Tatil$/i.test(o.str));
    const sayfaAlanlari = sutunlar.map((o) => o.str);
    if (!alanlar) alanlar = sayfaAlanlari;
    const merkezler = sutunlar.map((o) => o.cx);
    const solSinir = merkezler[0] - (merkezler[1] - merkezler[0]) / 2;
    for (const r of tarihSatirlari) {
      const to = r.obek.find((o) => TARIH_RE.test(o.str));
      const [, gg, aa, yyyy] = to.str.match(TARIH_RE);
      const kayit = { tarih: `${yyyy}-${aa}-${gg}`, atama: {}, tatil: false };
      for (const o of r.obek) {
        if (o === to) continue;
        if (o.cx < solSinir) { if (tatilSut || o.cx < to.x) kayit.tatil = true; continue; }
        const i = enYakin(merkezler, o.cx);
        const alan = sayfaAlanlari[i];
        kayit.atama[alan] = kayit.atama[alan] ? kayit.atama[alan] + ' ' + o.str : o.str;
      }
      satirListesi.push(kayit);
    }
  }
  return { alanlar: alanlar || [], satirlar: satirListesi, uyarilar };
}
