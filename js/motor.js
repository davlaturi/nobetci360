// Nöbet & görevlendirme motoru — arayüzden bağımsız, saf fonksiyonlar.
import { buyukHarf } from './pdfoku.js';

export const NEDENLER = ['Raporlu', 'Mazeretli', 'Görevli', 'İzinli', 'Sevkli'];
export const GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const SAAT_SAYISI = 8;
export const SABAH_SON = 4; // 1–4 sabah, 5–8 öğleden sonra

export function bosDurum() {
  return {
    surum: 1,
    okul: '',
    imza: { unvan: 'Müdür Yardımcısı', ad: '' }, // paylaşılan görevlendirmelerin altında görünür
    ogretmenler: [], // {id, ad, brans, program: {"g-s": [{ders, sinif}]}}
    saatler: ['08:30-09:10', '09:20-10:00', '10:10-10:50', '11:00-11:40', '11:50-12:30', '13:20-14:00', '14:10-14:50', '15:00-15:40'],
    alanlar: [],
    nobet: { baslangic: null, gunler: {}, atlananHaftalar: [] }, // gunler[1..5] = [{id, alan}] başlangıç haftasındaki sıra
    ayarlar: {}, // boş alanlar VARSAYILAN_KURALLAR'dan gelir
    kayitlar: {}, // "YYYY-MM-DD" -> {gelmeyenler:[{id, neden}], atamalar:[{saat, sinif, ders, gelmeyen, gorevli, elle}]}
  };
}

// ---------- tarih yardımcıları (yerel saat, saat dilimi kayması olmadan)
export function tarihStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function tarihNesne(s) {
  const [y, m, g] = s.split('-').map(Number);
  return new Date(y, m - 1, g, 12);
}
export function gunNo(s) { // 1=Pzt … 7=Paz
  const d = tarihNesne(s).getDay();
  return d === 0 ? 7 : d;
}
export function haftaPazartesi(s) {
  const d = tarihNesne(s);
  d.setDate(d.getDate() - (gunNo(s) - 1));
  return tarihStr(d);
}
export function gunEkle(s, n) {
  const d = tarihNesne(s);
  d.setDate(d.getDate() + n);
  return tarihStr(d);
}
export function trTarih(s) {
  const [y, m, g] = s.split('-');
  return `${g}.${m}.${y}`;
}

// ---------- isim eşleştirme
// Görüntü için Türkçe baş harf düzeni: "TÜRK DİLİ VE EDEBİYATI" → "Türk Dili ve Edebiyatı"
const KUCUK_KALAN = new Set(['ve', 'ile', 'veya', 'de', 'da']);
export function guzelAd(s) {
  return String(s || '')
    .toLocaleLowerCase('tr-TR')
    .split(/(\s+|[-/.])/)
    .map((p, i) => (i > 0 && KUCUK_KALAN.has(p) ? p : p.charAt(0).toLocaleUpperCase('tr-TR') + p.slice(1)))
    .join('');
}
export function basHarfler(s) {
  const p = adNorm(s).split(' ').filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toLocaleUpperCase('tr-TR');
}

export function adNorm(s) {
  return buyukHarf(s).replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
}
function adPuan(a, b) {
  const x = adNorm(a).split(' ');
  const y = adNorm(b).split(' ');
  if (x.join(' ') === y.join(' ')) return 100;
  if (x[x.length - 1] !== y[y.length - 1]) return 0; // soyad aynı olmalı
  // kalan parçalar: tam eşleşme ya da baş harf eşleşmesi
  const kx = x.slice(0, -1), ky = y.slice(0, -1);
  let puan = 40;
  for (const p of kx) {
    if (ky.includes(p)) puan += 15;
    else if (p.length === 1 && ky.some((q) => q[0] === p)) puan += 8;
    else if (ky.some((q) => q.length === 1 && q === p[0])) puan += 8;
    else puan -= 10;
  }
  return puan;
}
export function ogretmenBul(ad, ogretmenler) {
  let en = null, enP = 0, ikinci = 0;
  for (const o of ogretmenler) {
    const p = adPuan(ad, o.ad);
    if (p > enP) { ikinci = enP; enP = p; en = o; } else if (p > ikinci) ikinci = p;
  }
  if (enP >= 48 && enP > ikinci) return en;
  return null;
}

let sayac = 0;
export function yeniId() {
  return 'o' + Date.now().toString(36) + (sayac++).toString(36);
}

// ---------- ders programı içe aktarma
// PDF'te bulunan öğretmenlerin programı yenilenir, diğerleri olduğu gibi kalır.
export function programAktar(durum, cozum) {
  const rapor = { eklenen: [], guncellenen: [] };
  for (const yeni of cozum.ogretmenler) {
    const var_ = durum.ogretmenler.find((o) => adNorm(o.ad) === adNorm(yeni.ad));
    if (var_) {
      var_.program = yeni.program;
      if (yeni.brans) var_.brans = yeni.brans;
      rapor.guncellenen.push(yeni.ad);
    } else {
      durum.ogretmenler.push({ id: yeniId(), ad: yeni.ad, brans: yeni.brans, program: yeni.program });
      rapor.eklenen.push(yeni.ad);
    }
  }
  if (cozum.okul && !durum.okul) durum.okul = cozum.okul;
  if (cozum.saatler && cozum.saatler.length >= SAAT_SAYISI) durum.saatler = cozum.saatler.slice(0, SAAT_SAYISI);
  durum.ogretmenler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  return rapor;
}

// ---------- nöbet çizelgesi içe aktarma
// İlk dolu haftayı temel alır; sonraki haftaların kurala uyup uymadığını raporlar.
export function nobetAktar(durum, cozum) {
  const rapor = { eslesmeyen: [], hafta: 0, uyumlu: 0, uyumsuz: [] };
  if (!cozum.alanlar.length) throw new Error('Nöbet alanları okunamadı');
  durum.alanlar = cozum.alanlar.map((a) => a.replace(/\s*-\s*/g, '-').replace(/^2,kat/i, '2. Kat').replace(/-/g, ' - '));
  const idBul = (ad) => {
    const o = ogretmenBul(ad, durum.ogretmenler);
    if (o) return o.id;
    // programda olmayan öğretmen: listeye ekle (dersi yok sayılır)
    const yeni = { id: yeniId(), ad: adNorm(ad), brans: '', program: {} };
    durum.ogretmenler.push(yeni);
    rapor.eslesmeyen.push(ad);
    return yeni.id;
  };
  const dolu = cozum.satirlar.filter((s) => Object.keys(s.atama).length && gunNo(s.tarih) <= 5);
  if (!dolu.length) throw new Error('Çizelgede nöbetçi bulunamadı');
  const bas = haftaPazartesi(dolu[0].tarih);
  const gunler = {};
  for (const s of dolu.filter((s) => haftaPazartesi(s.tarih) === bas)) {
    gunler[gunNo(s.tarih)] = cozum.alanlar
      .map((alan, i) => (s.atama[alan] ? { id: idBul(s.atama[alan]), alan: i } : null))
      .filter(Boolean);
  }
  durum.nobet = { baslangic: bas, gunler, atlananHaftalar: [] };
  // doğrulama
  const haftalar = new Set(dolu.map((s) => haftaPazartesi(s.tarih)));
  rapor.hafta = haftalar.size;
  for (const s of dolu) {
    const beklenen = gununNobetcileri(durum, s.tarih);
    const ok = cozum.alanlar.every((alan, i) => {
      const b = beklenen.find((n) => n.alan === i);
      const gercek = s.atama[alan];
      if (!b && !gercek) return true;
      if (!b || !gercek) return false;
      const o = ogretmenBul(gercek, durum.ogretmenler);
      return o && o.id === b.id;
    });
    if (ok) rapor.uyumlu++; else rapor.uyumsuz.push(s.tarih);
  }
  durum.ogretmenler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  return rapor;
}

// ---------- haftalık kaydırma
export function haftaKaydirma(durum, tarih) {
  const { baslangic, atlananHaftalar = [] } = durum.nobet;
  if (!baslangic) return 0;
  const p = haftaPazartesi(tarih);
  const fark = Math.round((tarihNesne(p) - tarihNesne(baslangic)) / (7 * 864e5));
  if (fark >= 0) return fark - atlananHaftalar.filter((h) => h >= baslangic && h < p).length;
  return fark + atlananHaftalar.filter((h) => h >= p && h < baslangic).length;
}

// Belirli bir günün nöbetçileri ve alanları: [{id, alan}]
export function gununNobetcileri(durum, tarih) {
  const g = gunNo(tarih);
  const liste = durum.nobet.gunler[g] || [];
  if (!liste.length) return [];
  const n = liste.length;
  const k = haftaKaydirma(durum, tarih);
  const yuvalar = liste.map((x) => x.alan); // o günün kullandığı alanlar (sırayla)
  return liste.map((x, i) => ({ id: x.id, alan: yuvalar[(((i + k) % n) + n) % n] }));
}

export function haftaAtlandiMi(durum, tarih) {
  return (durum.nobet.atlananHaftalar || []).includes(haftaPazartesi(tarih));
}

// ---------- görevlendirme
export function ogretmen(durum, id) {
  return durum.ogretmenler.find((o) => o.id === id);
}
export function dersiVarMi(o, g, s) {
  return !!(o && o.program && o.program[`${g}-${s}`] && o.program[`${g}-${s}`].length);
}
export const ESNEKLIK_SECENEKLERI = [
  { deger: 0, ad: 'Katı', aciklama: 'Sabah ve öğleden sonra tamamen ayrı sayılır.' },
  { deger: 0.5, ad: 'Esnek', aciklama: 'Öbür yarımdaki görevler yarım ağırlıkla sayılır. Öğleden sonra çok görev almış biri sabah boşluğunda geri sıraya düşer.' },
  { deger: 1, ad: 'Tek havuz', aciklama: 'Gün ayrımı yok; yalnız toplam görev sayısına bakılır.' },
];

// Bir yarımdaki boşluk için adalet puanı (küçük olan seçilir)
export function adaletPuani(sayac, y, esneklik = 0.5) {
  const s = sayac || { sabah: 0, ogle: 0 };
  const obur = y === 'sabah' ? 'ogle' : 'sabah';
  return s[y] + esneklik * s[obur];
}

// Dağıtım kuralları — farklı okul/durum varyasyonları kod değişmeden ayarla karşılanır.
export const VARSAYILAN_KURALLAR = {
  esneklik: 0.5, // öbür yarımdaki görevlerin ağırlığı (0 katı, 0.5 esnek, 1 tek havuz)
  sabahSon: SABAH_SON, // sabah grubunun son dersi (4 → 1–4 / 5–8; öğle arasına göre 5 de olabilir)
  gunlukSinir: 0, // bir öğretmene bir günde en çok kaç görev (0 = sınır yok); başka aday kalmazsa aşılır
  sayacBaslangic: null, // adalet sayacı bu tarihten itibaren sayılır (ör. 2. dönem başı); null = tüm kayıtlar
};
export function kurallar(durum) {
  return { ...VARSAYILAN_KURALLAR, ...(durum.ayarlar || {}) };
}

export function yarim(saat, sabahSon = SABAH_SON) {
  return saat <= sabahSon ? 'sabah' : 'ogle';
}

// Gelmeyen öğretmenlerin boşalan dersleri
export function bosDersler(durum, tarih, gelmeyenler) {
  const g = gunNo(tarih);
  const out = [];
  for (const { id } of gelmeyenler) {
    const o = ogretmen(durum, id);
    if (!o) continue;
    for (let s = 1; s <= SAAT_SAYISI; s++) {
      const h = o.program[`${g}-${s}`];
      if (!h || !h.length) continue;
      out.push({ saat: s, gelmeyen: id, sinif: h.map((d) => d.sinif).filter(Boolean).join(' / '), ders: [...new Set(h.map((d) => d.ders))].join(' / ') });
    }
  }
  return out.sort((a, b) => a.saat - b.saat || a.sinif.localeCompare(b.sinif, 'tr'));
}

// Geçmiş kayıtlardan görev sayıları: {id: {sabah, ogle}}
export function gorevSayilari(durum, haric = null, aralik = null) {
  const say = {};
  const { sabahSon } = kurallar(durum);
  for (const [t, k] of Object.entries(durum.kayitlar)) {
    if (t === haric) continue;
    if (aralik && (t < aralik[0] || t > aralik[1])) continue;
    for (const a of k.atamalar || []) {
      if (!a.gorevli) continue;
      const s = (say[a.gorevli] ||= { sabah: 0, ogle: 0 });
      s[yarim(a.saat, sabahSon)]++;
    }
  }
  return say;
}

// O saatte görev verilebilecek öğretmenler
export function uygunlar(durum, tarih, kayit, saat, atamaIndex = -1) {
  const g = gunNo(tarih);
  const gelmeyen = new Set(kayit.gelmeyenler.map((x) => x.id));
  const meşgul = new Set(kayit.atamalar.filter((a, i) => i !== atamaIndex && a.saat === saat && a.gorevli).map((a) => a.gorevli));
  const nobetci = gununNobetcileri(durum, tarih).map((n) => n.id);
  const bosMu = (id) => !gelmeyen.has(id) && !meşgul.has(id) && !dersiVarMi(ogretmen(durum, id), g, saat);
  const nob = nobetci.filter(bosMu);
  const diger = durum.ogretmenler.map((o) => o.id).filter((id) => !nobetci.includes(id) && bosMu(id));
  return { nobetci: nob, diger };
}

// Elle seçilmemiş dersleri adil biçimde dağıtır.
// Ölçüt sırası: günlük sınırı aşıyor mu → adalet puanı (aynı yarım + esneklik × öbür yarım)
//               → bugünkü görev sayısı → toplam → ad.
export function adaySirala(durum, adaylar, saat, gecmis, bugun) {
  const { esneklik, sabahSon, gunlukSinir } = kurallar(durum);
  const y = yarim(saat, sabahSon);
  const puan = (id) => {
    const s = gecmis[id] || { sabah: 0, ogle: 0 };
    const b = bugun[id] || 0;
    return [gunlukSinir && b >= gunlukSinir ? 1 : 0, adaletPuani(s, y, esneklik), b, s.sabah + s.ogle];
  };
  return [...adaylar].sort((p, q) => {
    const x = puan(p), z = puan(q);
    for (let k = 0; k < x.length; k++) if (x[k] !== z[k]) return x[k] - z[k];
    return (ogretmen(durum, p)?.ad || '').localeCompare(ogretmen(durum, q)?.ad || '', 'tr');
  });
}

export function adaletSayaci(durum, haric) {
  const { sayacBaslangic } = kurallar(durum);
  return gorevSayilari(durum, haric, sayacBaslangic ? [sayacBaslangic, '9999-12-31'] : null);
}

export function otomatikAta(durum, tarih, kayit) {
  const gecmis = adaletSayaci(durum, tarih);
  const bos = bosDersler(durum, tarih, kayit.gelmeyenler);
  // eski atamaları koru (elle yapılanlar ve hâlâ geçerli olanlar)
  const eski = new Map(kayit.atamalar.map((a) => [`${a.saat}|${a.gelmeyen}`, a]));
  kayit.atamalar = bos.map((b) => {
    const e = eski.get(`${b.saat}|${b.gelmeyen}`);
    return { ...b, gorevli: e && e.elle ? e.gorevli : null, elle: !!(e && e.elle) };
  });
  const bugun = {};
  for (const a of kayit.atamalar) if (a.gorevli) bugun[a.gorevli] = (bugun[a.gorevli] || 0) + 1;
  kayit.atamalar.forEach((a, i) => {
    if (a.elle) return;
    const { nobetci } = uygunlar(durum, tarih, kayit, a.saat, i);
    if (!nobetci.length) { a.gorevli = null; return; }
    a.gorevli = adaySirala(durum, nobetci, a.saat, gecmis, bugun)[0];
    bugun[a.gorevli] = (bugun[a.gorevli] || 0) + 1;
  });
  return kayit;
}

// Gelmeyen bir nöbetçinin boş kalan alanı
export function bosAlanlar(durum, tarih, kayit) {
  const gelmeyen = new Set(kayit.gelmeyenler.map((x) => x.id));
  return gununNobetcileri(durum, tarih).filter((n) => gelmeyen.has(n.id));
}

// ---------- aylık rapor
export function aylikRapor(durum, ay /* "YYYY-MM" */) {
  const aralik = [`${ay}-01`, `${ay}-31`];
  const gorev = gorevSayilari(durum, null, aralik);
  const dev = {};
  for (const [t, k] of Object.entries(durum.kayitlar)) {
    if (t < aralik[0] || t > aralik[1]) continue;
    for (const g of k.gelmeyenler) {
      const d = (dev[g.id] ||= {});
      d[g.neden] = (d[g.neden] || 0) + 1;
    }
  }
  const satir = durum.ogretmenler.map((o) => {
    const s = gorev[o.id] || { sabah: 0, ogle: 0 };
    return { id: o.id, ad: o.ad, sabah: s.sabah, ogle: s.ogle, toplam: s.sabah + s.ogle, devamsizlik: dev[o.id] || {} };
  });
  return satir;
}

// ---------- yedek
export function yedekDogrula(veri) {
  if (!veri || typeof veri !== 'object' || !Array.isArray(veri.ogretmenler) || !veri.nobet || typeof veri.kayitlar !== 'object') {
    throw new Error('Bu dosya bir Nöbet Görevlendirme yedeği değil');
  }
  return { ...bosDurum(), ...veri };
}
