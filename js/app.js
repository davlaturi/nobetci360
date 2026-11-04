import * as M from './motor.js';
import { dersProgramiCoz, nobetCizelgesiCoz, pdfParcalari } from './pdfoku.js';
import { belgeSayfalari, avatarNo } from './resim.js';
import { IKON, logoIsaret, logoYazi } from './ikonlar.js';

const ANAHTAR = 'nobet-gorevlendirme-v1';
const $ = (s, k = document) => k.querySelector(s);
const $$ = (s, k = document) => [...k.querySelectorAll(s)];
const e = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const G = M.guzelAd;

// ---------------- durum
let durum = yukle();
function yukle() {
  try {
    const v = localStorage.getItem(ANAHTAR);
    return v ? M.yedekDogrula(JSON.parse(v)) : M.bosDurum();
  } catch { return M.bosDurum(); }
}
function kaydet() { localStorage.setItem(ANAHTAR, JSON.stringify(durum)); }
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

function haftaIci(t, yon = 1) { while (M.gunNo(t) > 5) t = M.gunEkle(t, yon); return t; }
const BUGUN = () => M.tarihStr(new Date());
const ui = {
  sayfa: 'gorev',
  tarih: haftaIci(BUGUN()),
  hafta: M.haftaPazartesi(haftaIci(BUGUN())),
  ay: BUGUN().slice(0, 7),
};

const ogrAd = (id) => M.ogretmen(durum, id)?.ad || '?';
const ad = (id) => G(ogrAd(id));
const veriVar = () => durum.ogretmenler.length > 0;
const nobetVar = () => Object.keys(durum.nobet.gunler || {}).length > 0;
const imza = () => ({ unvan: 'Müdür Yardımcısı', ad: '', ...(durum.imza || {}) });
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const KISA_GUN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
function uzunTarih(t) { const [y, a, g] = t.split('-').map(Number); return `${g} ${AYLAR[a - 1]} ${y}`; }
function gunAy(t) { const [, a, g] = t.split('-').map(Number); return `${g} ${AYLAR[a - 1]}`; }

// ---------------- küçük bileşenler
const ikon = (n) => IKON[n] || '';
function avatar(adMetni, sinif = '') {
  return `<span class="avatar av${avatarNo(adMetni)} ${sinif}">${e(M.basHarfler(adMetni))}</span>`;
}
function kisi(adMetni, alt = '', boyut = '') {
  return `<div class="kisi">${avatar(adMetni, boyut)}<div><div class="ad">${e(G(adMetni))}</div>${alt ? `<div class="alt">${alt}</div>` : ''}</div></div>`;
}
function bosDurumKarti(baslik, metin, dugme = true) {
  return `<div class="kart bos-durum">${logoIsaret({ boyut: 56 })}<h2>${baslik}</h2><p>${metin}</p>
    ${dugme ? `<button class="btn btn-ana" data-git="veri">${ikon('dosya')} Verileri yükle</button>` : ''}</div>`;
}
function bildir(m, sure = 2600) {
  const b = $('#bildirim');
  b.textContent = m; b.classList.add('goster');
  clearTimeout(bildir.t); bildir.t = setTimeout(() => b.classList.remove('goster'), sure);
}

// ---------------- iskelet ve gezinme
const MENU = [
  { id: 'gorev', ad: 'Görevlendirme', kisa: 'Görev', ikon: 'gorev' },
  { id: 'nobet', ad: 'Nöbet çizelgesi', kisa: 'Nöbet', ikon: 'nobet' },
  { id: 'rapor', ad: 'Aylık rapor', kisa: 'Rapor', ikon: 'rapor' },
  { id: 'veri', ad: 'Veriler ve kurallar', kisa: 'Veriler', ikon: 'veri' },
];
function iskelet() {
  $('#marka-yan').innerHTML = `${logoIsaret({ boyut: 34 })}${logoYazi()}`;
  $('#marka-ust').innerHTML = `${logoIsaret({ boyut: 30 })}${logoYazi()}`;
  $('#okul-yan').textContent = durum.okul ? G(durum.okul) : '';
  $('#menu-yan').innerHTML = MENU.map((m) => `<button data-sayfa="${m.id}" class="${ui.sayfa === m.id ? 'aktif' : ''}">${ikon(m.ikon)}${m.ad}</button>`).join('');
  $('#menu-alt').innerHTML = MENU.map((m) => `<button data-sayfa="${m.id}" class="${ui.sayfa === m.id ? 'aktif' : ''}">${ikon(m.ikon)}${m.kisa}</button>`).join('');
}
function git(s) {
  ui.sayfa = s;
  iskelet();
  ciz();
  window.scrollTo(0, 0);
}
document.addEventListener('click', (ev) => {
  const s = ev.target.closest('[data-sayfa]');
  if (s) git(s.dataset.sayfa);
  const g = ev.target.closest('[data-git]');
  if (g) git(g.dataset.git);
});
function ciz() {
  const m = $('#icerik');
  if (ui.sayfa === 'gorev') gorevSayfasi(m);
  else if (ui.sayfa === 'nobet') nobetSayfasi(m);
  else if (ui.sayfa === 'rapor') raporSayfasi(m);
  else veriSayfasi(m);
}

// ---------------- paylaş / yazdır
async function yazdirBelge(belge) {
  bildir('Hazırlanıyor…', 1200);
  const sayfalar = await belgeSayfalari(belge, 2.8);
  $('#yazdir').innerHTML = sayfalar.map((b) => `<img alt="" src="${URL.createObjectURL(b)}">`).join('');
  await Promise.all($$('#yazdir img').map((i) => (i.complete ? null : new Promise((ok) => (i.onload = ok)))));
  setTimeout(() => window.print(), 60);
}
async function paylasBelge(belge, dosyaAdi) {
  bildir('Görsel hazırlanıyor…', 1200);
  const sayfalar = await belgeSayfalari(belge, 2.4);
  const kok = dosyaAdi.replace(/\.png$/, '');
  const dosyalar = sayfalar.map((b, i) => new File([b], sayfalar.length > 1 ? `${kok}-${i + 1}.png` : `${kok}.png`, { type: 'image/png' }));
  paylasDosyalar(dosyalar, belge.tur);
}
async function paylasDosyalar(dosyalar, baslik) {
  if (navigator.canShare && navigator.canShare({ files: dosyalar })) {
    try { await navigator.share({ files: dosyalar, title: baslik }); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  for (const f of dosyalar) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f); a.download = f.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  bildir(dosyalar.length > 1 ? `${dosyalar.length} sayfa indirildi` : 'İndirildi: ' + dosyalar[0].name);
}
async function paylasDosya(blob, dosyaAdi, baslik) {
  paylasDosyalar([new File([blob], dosyaAdi, { type: blob.type })], baslik);
}
async function paylasMetin(metin) {
  if (navigator.share) {
    try { await navigator.share({ text: metin }); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(metin); bildir('Metin panoya kopyalandı'); } catch { prompt('Metni kopyalayın:', metin); }
}

// =====================================================================
// GÖREVLENDİRME
// =====================================================================
function kayitAl(olustur = false) {
  let k = durum.kayitlar[ui.tarih];
  if (!k && olustur) k = durum.kayitlar[ui.tarih] = { gelmeyenler: [], atamalar: [] };
  return k;
}
function kayitGuncelle() {
  const k = kayitAl();
  if (!k) return;
  if (!k.gelmeyenler.length) delete durum.kayitlar[ui.tarih];
  else M.otomatikAta(durum, ui.tarih, k);
  kaydet();
}
function yarimAdi(y) {
  const s = M.kurallar(durum).sabahSon;
  return y === 'sabah' ? `Sabah · 1–${s}. ders` : `Öğleden sonra · ${s + 1}–${M.SAAT_SAYISI}. ders`;
}
function nedenRozet(n) {
  const sinif = { Raporlu: 'raporlu', Mazeretli: 'mazeretli', Görevli: 'gorevli', İzinli: 'izinli', Sevkli: 'sevkli' }[n] || '';
  return `<span class="rozet ${sinif}">${e(n)}</span>`;
}
function haftaSeridi(secili, onEk) {
  const pzt = M.haftaPazartesi(secili);
  const bugun = BUGUN();
  return `<div class="hafta-serit">
    <button class="btn btn-ikon" id="${onEk}-geri" title="Önceki hafta">${ikon('sol')}</button>
    <div class="gunler">${[0, 1, 2, 3, 4].map((i) => {
      const t = M.gunEkle(pzt, i);
      const kayitli = durum.kayitlar[t]?.gelmeyenler?.length;
      return `<button class="gun-dugme ${t === secili ? 'secili' : ''} ${t === bugun ? 'bugun' : ''}" data-tarih="${t}">
        <span class="g">${KISA_GUN[i]}</span><span class="n">${Number(t.slice(8))}</span>${kayitli ? '<span class="nokta"></span>' : ''}</button>`;
    }).join('')}</div>
    <button class="btn btn-ikon" id="${onEk}-ileri" title="Sonraki hafta">${ikon('sag')}</button>
    <label class="btn btn-ikon tarih-gizli" title="Tarih seç">${ikon('takvim')}<input type="date" id="${onEk}-tarih" value="${secili}"></label>
  </div>`;
}

function gorevSayfasi(m) {
  const g = M.gunNo(ui.tarih);
  const bas = `<div class="sayfa-bas"><div><p class="etiket">Görevlendirme</p><h1>${gunAy(ui.tarih)} <span class="ince">${M.GUN_ADLARI[g - 1]}</span></h1></div>${haftaSeridi(ui.tarih, 'g')}</div>`;
  if (!veriVar()) {
    m.innerHTML = bas + bosDurumKarti('Nöbetçi360’a hoş geldin', 'Başlamak için e-Okul’dan aldığın öğretmen ders programı ve nöbet çizelgesi PDF’lerini yükle. Gerisini uygulama halleder.');
    gorevOlaylari(m); return;
  }
  const k = kayitAl() || { gelmeyenler: [], atamalar: [] };
  const nobetciler = M.gununNobetcileri(durum, ui.tarih);
  const kur = M.kurallar(durum);
  const bugunGorev = {};
  for (const a of k.atamalar) if (a.gorevli) bugunGorev[a.gorevli] = (bugunGorev[a.gorevli] || 0) + 1;
  const acikta = k.atamalar.filter((a) => !a.gorevli).length;

  let h = bas;
  h += `<div class="ozet">
    <div><div class="s">${k.gelmeyenler.length}</div><div class="e">Gelmeyen öğretmen</div></div>
    <div><div class="s">${k.atamalar.length}</div><div class="e">Boşalan ders</div></div>
    <div><div class="s">${k.atamalar.length - acikta}</div><div class="e">Görevlendirilen</div></div>
    <div class="${acikta ? 'kirmizi' : k.atamalar.length ? 'yesil' : ''}"><div class="s">${acikta}</div><div class="e">Açıkta kalan</div></div>
  </div>`;

  // uyarılar
  const notlar = [];
  if (!nobetVar()) notlar.push(['bilgi', 'Nöbet çizelgesi yüklenmedi; görevlendirme için nöbetçi bulunamıyor.']);
  else if (!nobetciler.length) notlar.push(['bilgi', 'Bu gün için tanımlı nöbetçi yok.']);
  for (const b of M.bosAlanlar(durum, ui.tarih, k)) notlar.push(['', b.tumGun
    ? `<b>${e(ad(b.id))}</b> gelmedi; <b>${e(G(durum.alanlar[b.alan]))}</b> nöbet alanı bugün boş.`
    : `<b>${e(ad(b.id))}</b> ${e(b.kapsam)} saatlerinde yok; <b>${e(G(durum.alanlar[b.alan]))}</b> nöbet alanı bu saatlerde boş.`]);
  if (acikta) notlar.push(['hata', `${acikta} derse o saatte boş nöbetçi bulunamadı. Listeden nöbetçi olmayan boş bir öğretmen seçebilirsin.`]);
  for (const a of k.atamalar) if (a.duzeltme) notlar.push(['', e(a.duzeltme.replace(/([A-ZÇĞİÖŞÜ]{2,}(?: [A-ZÇĞİÖŞÜ.]{2,})+)/g, (m) => G(m)))]);
  // aylık yedek hatırlatması: kayıt varsa ve son yedek 30 günden eskiyse
  const gecen = durum.sonYedek ? Math.round((M.tarihNesne(BUGUN()) - M.tarihNesne(durum.sonYedek)) / 864e5) : Infinity;
  if (Object.keys(durum.kayitlar).length && gecen >= 30) {
    notlar.push(['bilgi', `${durum.sonYedek ? `Son yedek ${gecen} gün önce alındı.` : 'Henüz yedek alınmadı.'} Telefon değişirse ya da uygulama silinirse kayıtlar kaybolmasın diye <a href="#" data-git="veri"><b>Veriler → Yedeği indir</b></a> ile yedek al.`]);
  }
  h += notlar.map(([t, n]) => `<div class="not ${t}">${ikon(t === 'bilgi' ? 'saat' : 'uyari')}<div>${n}</div></div>`).join('');

  // gelmeyenler
  h += `<section class="bolum"><div class="bolum-bas"><h2>Gelmeyen öğretmenler</h2><span class="meta">${k.gelmeyenler.length ? k.gelmeyenler.length + ' kişi' : ''}</span></div>
    <div class="kart gelmeyen-kart">
      <div class="arama">${ikon('ara')}<input class="alan" id="ara" placeholder="Öğretmen ara ve ekle…" autocomplete="off"><div class="oneri-liste" id="oneriler" hidden></div></div>
      <div class="gelmeyen-liste">${k.gelmeyenler.map((x) => {
        const o = M.ogretmen(durum, x.id);
        const n = M.bosDersler(durum, ui.tarih, [x]).length;
        const gn = M.gunNo(ui.tarih);
        const sabahSon = M.kurallar(durum).sabahSon;
        const tum = M.tumGunMu(x);
        const yok = (s) => M.o_saatteYokMu(x, s);
        const sabahMi = !tum && x.saatler.length === sabahSon && x.saatler.every((s) => s <= sabahSon);
        const ogleMi = !tum && x.saatler.length === M.SAAT_SAYISI - sabahSon && x.saatler.every((s) => s > sabahSon);
        return `<div class="gelmeyen-blok" data-id="${x.id}"><div class="gelmeyen">${kisi(o?.ad || '?', tum ? `${e(G(o?.brans || ''))}${o?.brans ? ' · ' : ''}bugün ${n} ders` : `<b style="color:var(--vurgu-koyu)">Yalnız ${e(M.kapsamMetni(x))}</b> · ${n} ders boşalıyor`, 'b')}
          <label class="neden-sec">${nedenRozet(x.neden)}<select class="neden" aria-label="Neden">${M.NEDENLER.map((nd) => `<option ${nd === x.neden ? 'selected' : ''}>${nd}</option>`).join('')}</select></label>
          <button class="btn btn-hayalet btn-ikon btn-kucuk sil" title="Listeden çıkar">${ikon('kapat')}</button></div>
          <div class="saat-secim">
            <div class="saat-secim-bas"><span>Hangi saatlerde yok? <span class="soluk" style="font-weight:400">Koyu kutu: yok</span></span>
              <div class="segment kucuk-seg">
                <button data-kapsam="tum" class="${tum ? 'secili' : ''}">Tüm gün</button>
                <button data-kapsam="sabah" class="${sabahMi ? 'secili' : ''}">Sabah</button>
                <button data-kapsam="ogle" class="${ogleMi ? 'secili' : ''}">Öğleden sonra</button>
              </div></div>
            <div class="saat-kutular">${Array.from({ length: M.SAAT_SAYISI }, (_, i) => {
              const s = i + 1;
              const h = o?.program?.[`${gn}-${s}`];
              const sinif = h && h.length ? h.map((d) => d.sinif).join('/') : '';
              return `<button class="saat-kutu ${yok(s) ? 'yok' : ''} ${sinif ? 'dersli' : ''}" data-saat="${s}" title="${yok(s) ? 'Bu saatte yok' : 'Bu saatte okulda'}"><b>${s}</b><span>${e(sinif || 'boş')}</span></button>`;
            }).join('')}</div>
          </div></div>`;
      }).join('') || '<p class="bos-yazi">Bugün için gelmeyen öğretmen eklenmedi. Yukarıdan adını yazarak ekleyebilirsin.</p>'}</div>
    </div></section>`;

  // görev listesi
  if (k.atamalar.length) {
    const gecmis = M.adaletSayaci(durum, ui.tarih);
    const esn = M.ESNEKLIK_SECENEKLERI.find((x) => x.deger === kur.esneklik);
    h += `<section class="bolum"><div class="bolum-bas"><h2>Görevlendirme</h2><span class="meta">Dağıtım: ${e(esn ? esn.ad : '')}${kur.gunlukSinir ? ` · günde en çok ${kur.gunlukSinir}` : ''}</span></div><div class="kart">`;
    let son = '';
    k.atamalar.forEach((a, i) => {
      const y = M.yarim(a.saat, kur.sabahSon);
      if (y !== son) { son = y; h += `<div class="grup-bas">${yarimAdi(y)}</div>`; }
      const u = M.uygunlar(durum, ui.tarih, k, a.saat, i);
      const bugunHaric = {};
      k.atamalar.forEach((b, j) => { if (j !== i && b.gorevli) bugunHaric[b.gorevli] = (bugunHaric[b.gorevli] || 0) + 1; });
      const nobetci = M.adaySirala(durum, u.nobetci, a.saat, gecmis, bugunHaric);
      const say = (id) => {
        const s = gecmis[id] || { sabah: 0, ogle: 0 };
        const b = bugunHaric[id] || 0;
        return `sabah ${s.sabah} · öğle ${s.ogle}${b ? ` · bugün ${b}` : ''}${kur.gunlukSinir && b >= kur.gunlukSinir ? ' (sınırda)' : ''}`;
      };
      const listede = !a.gorevli || nobetci.includes(a.gorevli) || u.diger.includes(a.gorevli);
      const nobetciMi = a.gorevli && nobetci.includes(a.gorevli);
      const secim = a.gorevli
        ? kisi(ogrAd(a.gorevli), `${nobetciMi ? 'Nöbetçi' : 'Nöbetçi değil'} · ${say(a.gorevli)}${a.elle ? '<span class="etiket-elle">elle</span>' : ''}`)
        : `<div class="kisi"><span class="avatar bos">?</span><div><div class="ad">Görevli yok</div><div class="alt">Dokunup bir öğretmen seç</div></div></div>`;
      const zaman = (durum.saatler[a.saat - 1] || '').split('-')[0];
      h += `<div class="atama" data-i="${i}">
        <div class="saat-blok"><span class="no">${a.saat}<small>.</small></span><span class="zaman">${e(zaman)}</span></div>
        <div class="ust-satir"><span class="sinif-rozet">${e(a.sinif || '—')}</span>
          <div class="ders-bilgi"><div class="yerine">${e(ad(a.gelmeyen))} <span>yerine</span></div><div class="ders-adi">${e(G(a.ders))}</div></div></div>
        <div class="secici-sar"><div class="secici ${a.elle ? 'elle' : ''} ${a.gorevli ? '' : 'acik'}">${secim}
          <select class="gorevli" aria-label="Yerine girecek öğretmen">
            <option value="__oto">${a.elle ? '↺ Otomatik seçime dön' : 'Otomatik (önerilen)'}</option>
            <option value="" ${a.gorevli ? '' : 'selected'}>Görevli yok / boş geçsin</option>
            ${listede ? '' : `<option value="${a.gorevli}" selected>${e(ad(a.gorevli))} (uygun değil)</option>`}
            <optgroup label="Nöbetçiler — öneri sırasıyla">${nobetci.map((id) => `<option value="${id}" ${id === a.gorevli ? 'selected' : ''}>${e(ad(id))} — ${say(id)}</option>`).join('')}</optgroup>
            <optgroup label="Nöbetçi olmayan boş öğretmenler">${u.diger.map((id) => `<option value="${id}" ${id === a.gorevli ? 'selected' : ''}>${e(ad(id))}</option>`).join('')}</optgroup>
          </select></div></div>
      </div>`;
    });
    h += `<div class="alt-cubuk">
        <button class="btn btn-hayalet btn-kucuk" id="sifirla">${ikon('yenile')} Elle seçimleri sil, yeniden dağıt</button>
        <div class="dugmeler">
          <button class="btn" id="metin">${ikon('metin')} Metin</button>
          <button class="btn" id="yazdir-b">${ikon('yazdir')} Yazdır</button>
          <button class="btn btn-ana" id="resim">${ikon('paylas')} Görsel paylaş</button>
        </div></div></div></section>`;
  }

  // nöbetçiler
  if (nobetciler.length) {
    const gelmeyen = new Map(k.gelmeyenler.map((x) => [x.id, x]));
    const gorevSaat = {};
    for (const a of k.atamalar) if (a.gorevli) (gorevSaat[a.gorevli] ||= new Set()).add(a.saat);
    h += `<section class="bolum"><div class="bolum-bas"><h2>Günün nöbetçileri</h2><span class="lejant"><span><i style="background:var(--yesil-acik);border:1px solid #BFDCCB"></i>Boş saat</span><span><i style="background:var(--murekkep)"></i>Görevli</span><span><i style="background:var(--vurgu-acik);border:1px dashed var(--vurgu)"></i>Okulda değil</span></span></div><div class="kart">`;
    for (const n of [...nobetciler].sort((a, b) => a.alan - b.alan)) {
      const o = M.ogretmen(durum, n.id);
      const gx = gelmeyen.get(n.id);
      const sa = [];
      for (let s = 1; s <= M.SAAT_SAYISI; s++) {
        const cls = gx && M.o_saatteYokMu(gx, s) ? 'yok' : gorevSaat[n.id]?.has(s) ? 'gorev' : M.dersiVarMi(o, g, s) ? '' : 'bos';
        sa.push(`<i class="${cls}">${s}</i>`);
      }
      const gel = gx && M.tumGunMu(gx);
      const kismi = gx && !gel;
      h += `<div class="nobetci ${gel ? 'gelmedi' : ''}"><div class="alan-adi">${e(G(durum.alanlar[n.alan]))}</div>
        ${kisi(o?.ad || '?', gel ? 'Gelmedi' : kismi ? `${e(M.kapsamMetni(gx))} yok${bugunGorev[n.id] ? ` · bugün ${bugunGorev[n.id]} görev` : ''}` : `${e(G(o?.brans || ''))}${bugunGorev[n.id] ? ` · bugün ${bugunGorev[n.id]} görev` : ''}`, 'k')}
        <div class="saatler">${sa.join('')}</div></div>`;
    }
    h += `</div></section>`;
  }
  m.innerHTML = h;
  gorevOlaylari(m);
}

function gorevBelgesi() {
  const k = kayitAl();
  const SAAT = M.SAAT_SAYISI;
  const saatBasi = (s) => (durum.saatler[s - 1] || '').split('-')[0];

  // 1) gelmeyenler
  const gelmeyenSatir = k.gelmeyenler.map((x) => {
    const o = M.ogretmen(durum, x.id);
    const saatler = k.atamalar.filter((a) => a.gelmeyen === x.id).map((a) => a.saat);
    return [
      { ad: ad(x.id), bas: M.basHarfler(ogrAd(x.id)), alt: M.tumGunMu(x) ? G(o?.brans || '') : `${G(o?.brans || '')} · yalnız ${M.kapsamMetni(x)}` },
      { metin: x.neden, neden: x.neden },
      saatler.length,
      saatler.length ? saatler.map((s) => s + '.').join('  ') : '—',
    ];
  });

  // 2) görevliler × ders saatleri
  const gruplar = new Map(); // görevli id (ya da '' = bulunamadı) -> {saat: sınıf}
  for (const a of k.atamalar) {
    const anahtar = a.gorevli || '';
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, {});
    const g = gruplar.get(anahtar);
    g[a.saat] = g[a.saat] ? g[a.saat] + ' / ' + (a.sinif || '?') : (a.sinif || '?');
  }
  const sirali = [...gruplar.entries()].sort(([ia, a], [ib, b]) => {
    if (!ia) return 1; if (!ib) return -1; // bulunamayanlar en altta
    return Math.min(...Object.keys(a)) - Math.min(...Object.keys(b)) || ad(ia).localeCompare(ad(ib), 'tr');
  });
  const gorevSatir = sirali.map(([id, saatler]) => [
    id ? { ad: ad(id), bas: M.basHarfler(ogrAd(id)) } : { bos: true, ad: 'Görevli bulunamadı' },
    ...Array.from({ length: SAAT }, (_, i) => (saatler[i + 1] ? (id ? saatler[i + 1] : { metin: saatler[i + 1], acik: true }) : 0)),
    Object.keys(saatler).length,
  ]);
  const acikta = k.atamalar.filter((a) => !a.gorevli).length;

  return {
    tur: 'Günlük görevlendirme',
    baslik: uzunTarih(ui.tarih),
    altBaslik: M.GUN_ADLARI[M.gunNo(ui.tarih) - 1],
    okul: durum.okul ? G(durum.okul) : '',
    imza: imza(),
    ozet: [
      { deger: k.gelmeyenler.length, etiket: 'Gelmeyen' },
      { deger: k.atamalar.length, etiket: 'Boşalan ders' },
      acikta ? { deger: acikta, etiket: 'Açıkta', renk: '#D9482B' } : { deger: sirali.filter(([id]) => id).length, etiket: 'Görevli' },
    ],
    bloklar: [
      { tur: 'bolum', baslik: 'Gelmeyen öğretmenler', meta: `${k.gelmeyenler.length} öğretmen` },
      {
        tur: 'tablo', satirH: 42,
        sutunlar: [
          { baslik: 'Öğretmen', gen: 2.7, tur: 'kisi' },
          { baslik: 'Durum', gen: 1.15, tur: 'rozet' },
          { baslik: 'Boşalan', gen: 0.85, tur: 'sayi', hiza: 'orta' },
          { baslik: 'Ders saatleri', gen: 1.6, tur: 'soluk' },
        ],
        satirlar: gelmeyenSatir,
      },
      { tur: 'bolum', baslik: 'Görevlendirmeler', meta: 'Kutudaki sınıfa, o ders saatinde girilir' },
      {
        tur: 'tablo', satirH: 40, dikeyCizgi: 1, devamBaslik: 'Görevlendirmeler (devam)',
        sutunlar: [
          { baslik: 'Görevli öğretmen', gen: 2.35, tur: 'kisi' },
          ...Array.from({ length: SAAT }, (_, i) => ({ baslik: `${i + 1}.`, alt: saatBasi(i + 1), gen: 0.66, tur: 'sinif', hiza: 'orta' })),
          { baslik: 'Ders', gen: 0.6, tur: 'sayi', hiza: 'orta' },
        ],
        satirlar: gorevSatir,
      },
      { tur: 'notlar', liste: M.bosAlanlar(durum, ui.tarih, k).map((b) => b.tumGun
        ? `${G(durum.alanlar[b.alan])} nöbet alanı bugün boş (${ad(b.id)} gelmedi).`
        : `${G(durum.alanlar[b.alan])} nöbet alanı ${b.kapsam} saatlerinde boş (${ad(b.id)} yok).`) },
    ],
  };
}

function gorevOlaylari(m) {
  const tarihSec = (t) => {
    if (!t) return;
    if (M.gunNo(t) > 5) { t = haftaIci(t); bildir('Hafta sonu seçildi; Pazartesi’ye geçildi'); }
    ui.tarih = t; ciz();
  };
  $$('[data-tarih]', m).forEach((b) => (b.onclick = () => tarihSec(b.dataset.tarih)));
  $('#g-geri', m).onclick = () => tarihSec(M.gunEkle(ui.tarih, -7));
  $('#g-ileri', m).onclick = () => tarihSec(M.gunEkle(ui.tarih, 7));
  $('#g-tarih', m).onchange = (ev) => tarihSec(ev.target.value);

  const ara = $('#ara', m);
  if (ara) {
    const liste = $('#oneriler', m);
    const k = kayitAl() || { gelmeyenler: [] };
    const g = M.gunNo(ui.tarih);
    let vurgu = 0, sonuclar = [];
    const goster = () => {
      const q = M.adNorm(ara.value);
      const secili = new Set(k.gelmeyenler.map((x) => x.id));
      sonuclar = durum.ogretmenler.filter((o) => !secili.has(o.id) && q && (M.adNorm(o.ad).split(' ').some((p) => p.startsWith(q)) || M.adNorm(o.ad).includes(q))).slice(0, 8);
      if (!q) { liste.hidden = true; return; }
      vurgu = 0;
      liste.innerHTML = sonuclar.map((o, i) => {
        let ders = 0; for (let s = 1; s <= 8; s++) if (M.dersiVarMi(o, g, s)) ders++;
        return `<div class="oneri ${i === 0 ? 'vurgu' : ''}" data-id="${o.id}">${kisi(o.ad, `${e(G(o.brans || ''))}${o.brans ? ' · ' : ''}bugün ${ders} ders`, 'k')}</div>`;
      }).join('') || '<div class="bos">Bu adla öğretmen bulunamadı.</div>';
      liste.hidden = false;
    };
    const ekle = (id) => {
      kayitAl(true).gelmeyenler.push({ id, neden: 'Raporlu' });
      kayitGuncelle(); ciz();
      setTimeout(() => $('#ara')?.focus(), 0);
    };
    ara.addEventListener('input', goster);
    ara.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && sonuclar[vurgu]) { ev.preventDefault(); ekle(sonuclar[vurgu].id); }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault(); vurgu = Math.max(0, Math.min(sonuclar.length - 1, vurgu + (ev.key === 'ArrowDown' ? 1 : -1)));
        $$('.oneri', liste).forEach((d, i) => d.classList.toggle('vurgu', i === vurgu));
      }
      if (ev.key === 'Escape') liste.hidden = true;
    });
    liste.addEventListener('mousedown', (ev) => { const d = ev.target.closest('[data-id]'); if (d) { ev.preventDefault(); ekle(d.dataset.id); } });
    ara.addEventListener('blur', () => setTimeout(() => (liste.hidden = true), 150));
  }

  $$('.gelmeyen-blok', m).forEach((satir) => {
    const id = satir.dataset.id;
    const kayitX = () => kayitAl().gelmeyenler.find((x) => x.id === id);
    const saatleriYaz = (liste) => {
      const x = kayitX();
      const s = [...new Set(liste)].filter((n) => n >= 1 && n <= M.SAAT_SAYISI).sort((a, b) => a - b);
      if (!s.length) { bildir('En az bir saat seçili olmalı; öğretmen geldiyse listeden çıkar.'); return; }
      if (s.length >= M.SAAT_SAYISI) delete x.saatler; else x.saatler = s;
      kayitGuncelle(); ciz();
    };
    $$('[data-kapsam]', satir).forEach((b) => (b.onclick = () => {
      const son = M.kurallar(durum).sabahSon;
      const tum = Array.from({ length: M.SAAT_SAYISI }, (_, i) => i + 1);
      saatleriYaz(b.dataset.kapsam === 'sabah' ? tum.filter((s) => s <= son) : b.dataset.kapsam === 'ogle' ? tum.filter((s) => s > son) : tum);
    }));
    $$('[data-saat]', satir).forEach((b) => (b.onclick = () => {
      const x = kayitX();
      const s = +b.dataset.saat;
      const simdi = M.tumGunMu(x) ? Array.from({ length: M.SAAT_SAYISI }, (_, i) => i + 1) : [...x.saatler];
      saatleriYaz(simdi.includes(s) ? simdi.filter((n) => n !== s) : [...simdi, s]);
    }));
    $('.neden', satir).onchange = (ev) => { kayitAl().gelmeyenler.find((x) => x.id === id).neden = ev.target.value; kaydet(); ciz(); };
    $('.sil', satir).onclick = () => {
      const k = kayitAl(); k.gelmeyenler = k.gelmeyenler.filter((x) => x.id !== id);
      kayitGuncelle(); ciz();
    };
  });
  $$('select.gorevli', m).forEach((s) => (s.onchange = () => {
    const k = kayitAl(); const a = k.atamalar[+s.closest('.atama').dataset.i];
    if (s.value === '__oto') { a.elle = false; a.gorevli = null; }
    else { a.elle = true; a.gorevli = s.value || null; }
    kayitGuncelle(); ciz();
  }));
  $('#sifirla', m)?.addEventListener('click', () => {
    const k = kayitAl(); k.atamalar.forEach((a) => { a.elle = false; a.gorevli = null; });
    kayitGuncelle(); ciz(); bildir('Kurallara göre yeniden dağıtıldı');
  });
  $('#resim', m)?.addEventListener('click', () => paylasBelge(gorevBelgesi(), `gorevlendirme-${ui.tarih}.png`));
  $('#yazdir-b', m)?.addEventListener('click', () => yazdirBelge(gorevBelgesi()));
  $('#metin', m)?.addEventListener('click', () => {
    const k = kayitAl();
    let t = `*Görevlendirme · ${uzunTarih(ui.tarih)} ${M.GUN_ADLARI[M.gunNo(ui.tarih) - 1]}*\n`;
    if (durum.okul) t += `${G(durum.okul)}\n`;
    t += `\n*Gelmeyen öğretmenler*\n${k.gelmeyenler.map((x) => `• ${ad(x.id)} — ${x.neden}${M.tumGunMu(x) ? '' : ` (${M.kapsamMetni(x)})`}`).join('\n')}\n`;
    const gruplar = new Map();
    for (const a of k.atamalar) {
      const id = a.gorevli || '';
      if (!gruplar.has(id)) gruplar.set(id, []);
      gruplar.get(id).push(`${a.saat}. ders ${a.sinif || '?'}`);
    }
    t += `\n*Görevlendirmeler*\n`;
    for (const [id, l] of [...gruplar.entries()].sort(([a], [b]) => (!a) - (!b))) t += `• ${id ? ad(id) : 'GÖREVLİ BULUNAMADI'}: ${l.join(', ')}\n`;
    const bos = M.bosAlanlar(durum, ui.tarih, k);
    if (bos.length) t += '\n' + bos.map((b) => `⚠ ${G(durum.alanlar[b.alan])} nöbet alanı boş (${ad(b.id)} gelmedi)`).join('\n') + '\n';
    const im = imza();
    if (im.ad) t += `\n${im.ad}\n${im.unvan}`;
    paylasMetin(t.trim());
  });
}

// =====================================================================
// HAFTALIK NÖBET
// =====================================================================
function nobetBelgesi() {
  const gunler = [0, 1, 2, 3, 4].map((i) => M.gunEkle(ui.hafta, i));
  const tatil = M.haftaAtlandiMi(durum, ui.hafta);
  return {
    tur: 'Haftalık nöbet çizelgesi',
    baslik: `${gunAy(gunler[0])} – ${gunAy(gunler[4])}`,
    altBaslik: gunler[4].slice(0, 4),
    okul: durum.okul ? G(durum.okul) : '',
    imza: imza(),
    ozet: [{ deger: durum.alanlar.length, etiket: 'Nöbet alanı' }, { deger: new Set(gunler.flatMap((t) => M.gununNobetcileri(durum, t).map((n) => n.id))).size, etiket: 'Nöbetçi' }],
    bloklar: [
      { tur: 'bolum', baslik: 'Alanlara göre nöbetçiler', meta: tatil ? 'Tatil haftası' : 'Her hafta bir sonraki alana geçilir' },
      {
        tur: 'tablo', satirH: 44, dikeyCizgi: 1,
        sutunlar: [{ baslik: 'Nöbet alanı', gen: 1.4, tur: 'kalin', vurgulu: true }, ...gunler.map((t, i) => ({ baslik: M.GUN_ADLARI[i], alt: gunAy(t), gen: 1.25, tur: 'metin', hiza: 'orta' }))],
        satirlar: durum.alanlar.map((alan, ai) => [G(alan), ...gunler.map((t) => { const n = M.gununNobetcileri(durum, t).find((x) => x.alan === ai); return n ? { metin: ad(n.id), kalin: true } : '—'; })]),
      },
      { tur: 'notlar', liste: tatil ? ['Bu hafta tatil olarak işaretli; sonraki haftalarda kaydırma ilerlemez.'] : [] },
    ],
  };
}
function nobetSayfasi(m) {
  const gunler = [0, 1, 2, 3, 4].map((i) => M.gunEkle(ui.hafta, i));
  const bas = `<div class="sayfa-bas"><div><p class="etiket">Nöbet çizelgesi</p><h1>${gunAy(gunler[0])} – ${gunAy(gunler[4])} <span class="ince">${gunler[4].slice(0, 4)}</span></h1></div>
    <div class="dugmeler"><button class="btn btn-ikon" id="h-geri" title="Önceki hafta">${ikon('sol')}</button><button class="btn" id="h-bu">Bu hafta</button><button class="btn btn-ikon" id="h-ileri" title="Sonraki hafta">${ikon('sag')}</button></div></div>`;
  if (!nobetVar()) { m.innerHTML = bas + bosDurumKarti('Nöbet çizelgesi yok', 'Nöbet çizelgesi PDF’ini yüklediğinde haftalık kaydırma burada kendiliğinden hesaplanır.'); nobetOlaylari(m); return; }
  const tatil = M.haftaAtlandiMi(durum, ui.hafta);
  const k = M.haftaKaydirma(durum, ui.hafta);
  const bugun = BUGUN();
  let h = bas + `<div class="kart ic" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px">
      <label class="anahtar"><input type="checkbox" id="tatil" ${tatil ? 'checked' : ''}> Bu hafta tatil — kaydırma ilerlemesin</label>
      <span class="soluk kucuk-yazi">Başlangıç ${M.trTarih(durum.nobet.baslangic)} · ${k}. kaydırma</span></div>`;
  h += `<section class="bolum"><div class="kart"><div class="tablo-sar nobet-tablo"><table class="tablo"><thead><tr><th class="ilk">Alan</th>${gunler.map((t, i) => `<th class="${t === bugun ? 'bugun-sutun' : ''}">${M.GUN_ADLARI[i]}<span class="gun-alt">${gunAy(t)}</span></th>`).join('')}</tr></thead><tbody>`;
  durum.alanlar.forEach((alan, ai) => {
    h += `<tr><td class="ilk">${e(G(alan))}</td>${gunler.map((t) => {
      const n = M.gununNobetcileri(durum, t).find((x) => x.alan === ai);
      const gel = n && durum.kayitlar[t]?.gelmeyenler?.some((x) => x.id === n.id && M.tumGunMu(x));
      return `<td class="${t === bugun ? 'bugun-sutun' : ''}">${n ? `<div class="kisi" ${gel ? 'title="Gelmedi"' : ''}><div class="ad" style="${gel ? 'text-decoration:line-through;color:var(--soluk)' : ''}">${e(ad(n.id))}</div></div>` : '<span class="bos-hucre">—</span>'}</td>`;
    }).join('')}</tr>`;
  });
  h += `</tbody></table></div>
    <div class="gun-kartlari">${gunler.map((t, i) => {
      const liste = M.gununNobetcileri(durum, t).sort((a, b) => a.alan - b.alan);
      return `<div class="gun-karti ${t === bugun ? 'bugun' : ''}"><div class="gun-karti-bas">${M.GUN_ADLARI[i]} <span>${gunAy(t)}${t === bugun ? ' · bugün' : ''}</span></div>
        ${liste.map((n) => `<div class="gun-karti-satir"><span class="alan-adi">${e(G(durum.alanlar[n.alan]))}</span>${kisi(ogrAd(n.id), '', 'k')}</div>`).join('') || '<div class="gun-karti-satir soluk">Nöbetçi yok</div>'}</div>`;
    }).join('')}</div>
    <div class="alt-cubuk"><span class="soluk kucuk-yazi">Her hafta herkes bir sonraki alana geçer; son alandaki ilk alana döner.</span>
      <div class="dugmeler"><button class="btn" id="n-yazdir">${ikon('yazdir')} Yazdır</button><button class="btn btn-ana" id="n-resim">${ikon('paylas')} Görsel paylaş</button></div></div></div></section>`;
  m.innerHTML = h;
  nobetOlaylari(m);
}
function nobetOlaylari(m) {
  $('#h-geri', m).onclick = () => { ui.hafta = M.gunEkle(ui.hafta, -7); ciz(); };
  $('#h-ileri', m).onclick = () => { ui.hafta = M.gunEkle(ui.hafta, 7); ciz(); };
  $('#h-bu', m).onclick = () => { ui.hafta = M.haftaPazartesi(haftaIci(BUGUN())); ciz(); };
  if ($('#tatil', m)) {
    $('#tatil', m).onchange = (ev) => {
      const l = new Set(durum.nobet.atlananHaftalar || []);
      ev.target.checked ? l.add(ui.hafta) : l.delete(ui.hafta);
      durum.nobet.atlananHaftalar = [...l].sort(); kaydet(); ciz();
    };
    $('#n-resim', m).onclick = () => paylasBelge(nobetBelgesi(), `nobet-${ui.hafta}.png`);
    $('#n-yazdir', m).onclick = () => yazdirBelge(nobetBelgesi());
  }
}

// =====================================================================
// AYLIK RAPOR
// =====================================================================
function raporSatirlari() {
  const r = M.aylikRapor(durum, ui.ay).filter((x) => x.toplam || Object.keys(x.devamsizlik).length);
  r.sort((a, b) => b.toplam - a.toplam || a.ad.localeCompare(b.ad, 'tr'));
  return r;
}
function ayAdi() { const [y, a] = ui.ay.split('-').map(Number); return `${AYLAR[a - 1]} ${y}`; }
function raporBelgesi() {
  const r = raporSatirlari();
  const max = Math.max(1, ...r.map((x) => x.toplam));
  const gunSay = Object.keys(durum.kayitlar).filter((t) => t.startsWith(ui.ay)).length;
  return {
    tur: 'Aylık görevlendirme raporu',
    baslik: ayAdi(),
    okul: durum.okul ? G(durum.okul) : '',
    imza: imza(),
    ozet: [{ deger: r.reduce((t, x) => t + x.toplam, 0), etiket: 'Görevlendirme' }, { deger: gunSay, etiket: 'Kayıtlı gün' }],
    bloklar: [
      { tur: 'bolum', baslik: 'Kim kaç kez görevlendirildi', meta: 'Çubuk: lacivert sabah, kiremit öğleden sonra' },
      {
        tur: 'tablo', satirH: 38, devamBaslik: 'Kim kaç kez görevlendirildi (devam)',
        sutunlar: [
          { baslik: 'Öğretmen', gen: 2.3, tur: 'kisi' },
          { baslik: 'Dağılım', gen: 1.5, tur: 'cubuk' },
          { baslik: 'Sabah', gen: 0.62, tur: 'sayi', hiza: 'sag' },
          { baslik: 'Öğle', gen: 0.62, tur: 'sayi', hiza: 'sag' },
          { baslik: 'Toplam', gen: 0.7, tur: 'sayi', hiza: 'sag' },
          { baslik: 'Gelmediği gün', gen: 1.5, tur: 'soluk' },
        ],
        satirlar: r.map((x) => [
          { ad: G(x.ad), bas: M.basHarfler(x.ad) },
          x.toplam ? { s: x.sabah, o: x.ogle, max } : null,
          x.sabah, x.ogle, x.toplam,
          Object.entries(x.devamsizlik).map(([n, s]) => `${n} ${s}`).join(', ') || '—',
        ]),
      },
    ],
  };
}
function raporSayfasi(m) {
  const bas = `<div class="sayfa-bas"><div><p class="etiket">Aylık rapor</p><h1>${ayAdi()}</h1></div>
    <div class="dugmeler"><button class="btn btn-ikon" id="a-geri" title="Önceki ay">${ikon('sol')}</button><button class="btn" id="a-bu">Bu ay</button><button class="btn btn-ikon" id="a-ileri" title="Sonraki ay">${ikon('sag')}</button></div></div>`;
  if (!veriVar()) { m.innerHTML = bas + bosDurumKarti('Henüz rapor yok', 'Görevlendirme yaptıkça kimin kaç kez derse girdiği burada birikir.'); raporOlaylari(m); return; }
  const r = raporSatirlari();
  const gunler = Object.keys(durum.kayitlar).filter((t) => t.startsWith(ui.ay)).sort();
  const toplam = r.reduce((t, x) => t + x.toplam, 0);
  const gelmeyenGun = r.reduce((t, x) => t + Object.values(x.devamsizlik).reduce((a, b) => a + b, 0), 0);
  const enCok = r.find((x) => x.toplam);
  const max = Math.max(1, ...r.map((x) => x.toplam));
  let h = bas + `<div class="ozet">
    <div><div class="s">${toplam}</div><div class="e">Toplam görevlendirme</div></div>
    <div><div class="s">${gunler.length}</div><div class="e">Kayıtlı gün</div></div>
    <div><div class="s">${gelmeyenGun}</div><div class="e">Gelmeme (kişi × gün)</div></div>
    <div><div class="s" style="font-size:17px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${enCok ? e(G(enCok.ad)) : '—'}</div><div class="e">En çok görev alan${enCok ? ` · ${enCok.toplam}` : ''}</div></div></div>`;
  if (!r.length) {
    h += `<div class="kart bos-durum"><h2>Bu ay kayıt yok</h2><p>Görevlendirme ekranında gelmeyen öğretmen eklediğin günler burada sayılır.</p></div>`;
  } else {
    h += `<section class="bolum"><div class="bolum-bas"><h2>Kim kaç kez görevlendirildi?</h2><span class="lejant"><span><i style="background:var(--murekkep)"></i>Sabah</span><span><i style="background:var(--vurgu)"></i>Öğleden sonra</span></span></div>
      <div class="kart"><div class="tablo-sar"><table class="tablo rapor-tablo"><thead><tr><th class="ilk">Öğretmen</th><th class="genis">Dağılım</th><th class="sayi-h">Sabah</th><th class="sayi-h">Öğle</th><th class="sayi-h">Top.</th><th>Gelmediği gün</th></tr></thead><tbody>
      ${r.map((x) => {
        const cubuk = x.toplam ? `<div class="cubuk-grafik"><div class="cubuk"><i class="s" style="width:${(x.sabah / max) * 100}%"></i><i class="o" style="width:${(x.ogle / max) * 100}%"></i></div></div>` : '';
        return `<tr><td class="ilk">${kisi(x.ad, '', 'k')}<div class="dar-cubuk">${cubuk}</div></td>
        <td class="genis">${cubuk}</td>
        <td class="sayi-h">${x.sabah}</td><td class="sayi-h">${x.ogle}</td><td class="sayi-h"><b>${x.toplam}</b></td>
        <td>${Object.entries(x.devamsizlik).map(([n, s]) => `<span class="rozet ${{ Raporlu: 'raporlu', Mazeretli: 'mazeretli', Görevli: 'gorevli', İzinli: 'izinli', Sevkli: 'sevkli' }[n] || ''}">${e(n)} ${s}</span>`).join(' ') || '<span class="bos-hucre">—</span>'}</td></tr>`;
      }).join('')}
      </tbody></table></div>
      <div class="alt-cubuk"><span class="soluk kucuk-yazi">Sabah/öğle ayrımı: ${yarimAdi('sabah').split('·')[1].trim()} sabah sayılır.</span>
        <div class="dugmeler"><button class="btn" id="r-yazdir">${ikon('yazdir')} Yazdır</button><button class="btn btn-ana" id="r-resim">${ikon('paylas')} Görsel paylaş</button></div></div></div></section>`;
  }
  if (gunler.length) {
    h += `<section class="bolum"><div class="bolum-bas"><h2>Kayıtlı günler</h2><span class="meta">${gunler.length} gün</span></div><div class="kart">${gunler.map((t) => {
      const k = durum.kayitlar[t];
      return `<div class="liste-satir"><div class="simge">${ikon('takvim')}</div><div class="govde"><div class="baslik">${uzunTarih(t)}, ${M.GUN_ADLARI[M.gunNo(t) - 1]}</div>
        <div class="aciklama">${k.gelmeyenler.map((x) => e(ad(x.id))).join(', ')} · ${k.atamalar.length} ders</div></div><button class="btn btn-kucuk" data-gun="${t}">Aç ${ikon('sag')}</button></div>`;
    }).join('')}</div></section>`;
  }
  m.innerHTML = h;
  raporOlaylari(m);
}
function raporOlaylari(m) {
  const kaydir = (n) => { const [y, a] = ui.ay.split('-').map(Number); const d = new Date(y, a - 1 + n, 1); ui.ay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; ciz(); };
  $('#a-geri', m).onclick = () => kaydir(-1);
  $('#a-ileri', m).onclick = () => kaydir(1);
  $('#a-bu', m).onclick = () => { ui.ay = BUGUN().slice(0, 7); ciz(); };
  $$('[data-gun]', m).forEach((b) => (b.onclick = () => { ui.tarih = b.dataset.gun; git('gorev'); }));
  if ($('#r-resim', m)) {
    $('#r-resim', m).onclick = () => paylasBelge(raporBelgesi(), `rapor-${ui.ay}.png`);
    $('#r-yazdir', m).onclick = () => yazdirBelge(raporBelgesi());
  }
}

// =====================================================================
// VERİLER
// =====================================================================
let pdfjsYuk = null;
async function pdfjs() {
  if (!pdfjsYuk) {
    pdfjsYuk = import('../lib/pdf.min.mjs').then((p) => {
      p.GlobalWorkerOptions.workerSrc = new URL('../lib/pdf.worker.min.mjs', import.meta.url).href;
      return p;
    });
  }
  return pdfjsYuk;
}
async function pdfOku(dosya) {
  const p = await pdfjs();
  return pdfParcalari(p, new Uint8Array(await dosya.arrayBuffer()));
}

function kurallarKarti() {
  const k = M.kurallar(durum);
  const seg = (id, secenekler, secili) => `<div class="segment" id="${id}">${secenekler.map(([d, a]) => `<button class="${d === secili ? 'secili' : ''}" data-d="${d}">${e(a)}</button>`).join('')}</div>`;
  const esn = M.ESNEKLIK_SECENEKLERI.find((x) => x.deger === k.esneklik);
  return `<section class="bolum"><div class="bolum-bas"><h2>Dağıtım kuralları</h2><span class="meta">Bugünden sonrasına uygulanır</span></div><div class="kart">
    <div class="kural"><div class="baslik">Sabah grubu nerede biter?</div>${seg('kural-sabah', [[4, '1–4 · 5–8'], [5, '1–5 · 6–8']], k.sabahSon)}
      <div class="aciklama">Öğle arası 5. dersten sonraysa 1–5’i seç.</div></div>
    <div class="kural"><div class="baslik">Sabah ve öğleden sonra ne kadar ayrı sayılsın?</div>${seg('kural-esneklik', M.ESNEKLIK_SECENEKLERI.map((x) => [x.deger, x.ad]), k.esneklik)}
      <div class="aciklama">${e(esn ? esn.aciklama : '')}</div></div>
    <div class="kural"><div class="baslik">Bir öğretmene günde en çok kaç görev?</div>${seg('kural-sinir', [[0, 'Sınır yok'], [1, '1'], [2, '2'], [3, '3']], k.gunlukSinir)}
      <div class="aciklama">Başka boş nöbetçi kalmazsa ders boş kalmasın diye sınır aşılır.</div></div>
    <div class="kural"><div class="baslik">Adalet sayacı hangi tarihten başlasın?</div>
      <div class="dugmeler"><input type="date" class="alan" style="width:auto" id="kural-donem" value="${k.sayacBaslangic || ''}"><button class="btn btn-kucuk" id="kural-donem-sil">Tüm kayıtlar</button></div>
      <div class="aciklama">${k.sayacBaslangic ? `${M.trTarih(k.sayacBaslangic)} öncesi görevler sıra hesabında sayılmaz; raporda durur.` : 'Şu an tüm kayıtlar sayılıyor. 2. dönemde herkesi sıfırdan başlatmak için tarih seçebilirsin.'}</div></div>
  </div></section>`;
}

function veriSayfasi(m) {
  const nobetciSay = new Set(Object.values(durum.nobet.gunler || {}).flat().map((x) => x.id)).size;
  const im = imza();
  m.innerHTML = `<div class="sayfa-bas"><div><p class="etiket">Ayarlar</p><h1>Veriler ve kurallar</h1></div></div>
  <div id="mesaj"></div>

  <section class="bolum"><div class="bolum-bas"><h2>Okul bilgileri</h2><span class="meta">Paylaşılan görsellerde ve çıktılarda görünür</span></div>
    <div class="kart ic">
      <div class="form-tek"><label for="f-okul">Okul adı</label><input class="alan" id="f-okul" value="${e(durum.okul ? G(durum.okul) : '')}" placeholder="Okulunuzun adı (ders programı PDF’inden otomatik gelir)"></div>
      <div class="form-satir" style="margin-bottom:0">
        <div><label for="f-imza-ad">Görevlendirmeyi yapan</label><input class="alan" id="f-imza-ad" value="${e(im.ad)}" placeholder="Ad Soyad"></div>
        <div><label for="f-imza-unvan">Unvan</label><input class="alan" id="f-imza-unvan" value="${e(im.unvan)}" placeholder="Müdür Yardımcısı"></div>
      </div>
    </div></section>

  <section class="bolum"><div class="bolum-bas"><h2>Kaynak dosyalar</h2><span class="meta">e-Okul PDF çıktıları</span></div><div class="kart">
    <div class="liste-satir"><div class="simge">${ikon('dosya')}</div><div class="govde"><div class="baslik">Öğretmen ders programı</div>
      <div class="aciklama">${durum.ogretmenler.length ? `${durum.ogretmenler.length} öğretmen yüklü. Programı değişen öğretmenin PDF’ini tek başına da yükleyebilirsin.` : 'Henüz yüklenmedi.'}</div></div>
      <div class="dugmeler"><label class="btn ${durum.ogretmenler.length ? '' : 'btn-ana'}">${ikon('yukle')} PDF yükle<input type="file" id="f-ders" accept="application/pdf,.pdf"></label></div></div>
    <div class="liste-satir"><div class="simge">${ikon('nobet')}</div><div class="govde"><div class="baslik">Nöbet çizelgesi</div>
      <div class="aciklama">${nobetVar() ? `${durum.alanlar.length} alan · ${nobetciSay} nöbetçi · başlangıç ${M.trTarih(durum.nobet.baslangic)}` : 'Henüz yüklenmedi. İlk haftası temel alınır, sonraki haftalar kendiliğinden kayar.'}</div></div>
      <div class="dugmeler">${nobetVar() ? `<button class="btn" id="nobet-duzen">${ikon('kalem')} Düzenle</button>` : ''}<label class="btn ${nobetVar() ? '' : 'btn-ana'}">${ikon('yukle')} PDF yükle<input type="file" id="f-nobet" accept="application/pdf,.pdf"></label></div></div>
  </div></section>

  ${kurallarKarti()}

  <section class="bolum"><div class="bolum-bas"><h2>Öğretmenler</h2><span class="meta">${durum.ogretmenler.length} kişi</span></div><div class="kart">
    <div style="display:flex;gap:8px;padding:14px 14px 12px"><div class="arama" style="flex:1">${ikon('ara')}<input class="alan" id="ogr-ara" placeholder="Öğretmen ara…"></div><button class="btn" id="ogr-ekle">${ikon('arti')} Ekle</button></div>
    <div class="ogr-liste" id="ogr-liste"></div></div></section>

  <section class="bolum"><div class="bolum-bas"><h2>Yedek</h2><span class="meta">Telefon ↔ bilgisayar aktarımı</span></div><div class="kart">
    <div class="liste-satir"><div class="simge">${ikon('indir')}</div><div class="govde"><div class="baslik">Yedeği indir</div><div class="aciklama">Tüm öğretmenler, nöbet düzeni, kurallar ve görevlendirme geçmişi tek dosyada.</div></div>
      <div class="dugmeler"><button class="btn" id="yedek-al">${ikon('indir')} İndir</button></div></div>
    <div class="liste-satir"><div class="simge">${ikon('yukle')}</div><div class="govde"><div class="baslik">Yedekten geri yükle</div><div class="aciklama">Bu cihazdaki veriler yedekteki verilerle değiştirilir.</div></div>
      <div class="dugmeler"><label class="btn">${ikon('yukle')} Dosya seç<input type="file" id="f-yedek" accept="application/json,.json"></label></div></div>
    <div class="liste-satir"><div class="simge" style="color:var(--vurgu-koyu);background:var(--vurgu-acik)">${ikon('cop')}</div><div class="govde"><div class="baslik">Tüm verileri sil</div><div class="aciklama">Geri alınamaz; önce yedek al.</div></div>
      <div class="dugmeler"><button class="btn btn-tehlike" id="hepsini-sil">Sil</button></div></div>
  </div></section>`;

  const mesaj = (html, tur = 'basari') => { $('#mesaj').innerHTML = `<div class="not ${tur}">${ikon(tur === 'hata' ? 'uyari' : tur === 'basari' ? 'tamam' : 'saat')}<div>${html}</div></div>`; window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // okul bilgileri
  $('#f-okul').onchange = (ev) => { durum.okul = ev.target.value.trim(); kaydet(); iskelet(); bildir('Okul adı kaydedildi'); };
  $('#f-imza-ad').onchange = (ev) => { durum.imza = { ...imza(), ad: ev.target.value.trim() }; kaydet(); bildir('Kaydedildi'); };
  $('#f-imza-unvan').onchange = (ev) => { durum.imza = { ...imza(), unvan: ev.target.value.trim() || 'Müdür Yardımcısı' }; kaydet(); bildir('Kaydedildi'); };

  // öğretmenler
  const nobetGunleri = {};
  for (const [g, l] of Object.entries(durum.nobet.gunler || {})) for (const x of l) (nobetGunleri[x.id] ||= []).push(+g);
  const ogrListe = () => {
    const q = M.adNorm($('#ogr-ara').value);
    $('#ogr-liste').innerHTML = durum.ogretmenler.filter((o) => !q || M.adNorm(o.ad).includes(q)).map((o) => {
      const n = Object.keys(o.program || {}).length;
      const ng = nobetGunleri[o.id];
      return `<div class="ogr-satir" data-id="${o.id}">${kisi(o.ad, e(G(o.brans || '')) || 'Branş yok', 'k')}<span class="sag">${ng ? `<span class="rozet">Nöbet: ${ng.map((g) => KISA_GUN[g - 1]).join(', ')}</span>` : ''}${n} saat ${ikon('sag')}</span></div>`;
    }).join('') || '<p class="bos-yazi" style="padding:14px 18px">Öğretmen yok.</p>';
  };
  ogrListe();
  $('#ogr-ara').oninput = ogrListe;
  $('#ogr-liste').onclick = (ev) => { const d = ev.target.closest('[data-id]'); if (d) ogretmenPenceresi(d.dataset.id); };
  $('#ogr-ekle').onclick = () => {
    const a = prompt('Yeni öğretmenin adı soyadı:');
    if (!a || !a.trim()) return;
    const o = { id: M.yeniId(), ad: M.adNorm(a), brans: '', program: {} };
    durum.ogretmenler.push(o); durum.ogretmenler.sort((x, y) => x.ad.localeCompare(y.ad, 'tr')); kaydet();
    ogretmenPenceresi(o.id);
  };

  // kurallar
  const kuralDegis = (degisim) => {
    durum.ayarlar = { ...(durum.ayarlar || {}), ...degisim };
    for (const [t, k] of Object.entries(durum.kayitlar)) if (t >= BUGUN()) M.otomatikAta(durum, t, k);
    kaydet(); veriSayfasi(m); bildir('Dağıtım kuralı güncellendi');
  };
  $$('#kural-esneklik [data-d]', m).forEach((b) => (b.onclick = () => kuralDegis({ esneklik: +b.dataset.d })));
  $$('#kural-sabah [data-d]', m).forEach((b) => (b.onclick = () => kuralDegis({ sabahSon: +b.dataset.d })));
  $$('#kural-sinir [data-d]', m).forEach((b) => (b.onclick = () => kuralDegis({ gunlukSinir: +b.dataset.d })));
  $('#kural-donem').onchange = (ev) => kuralDegis({ sayacBaslangic: ev.target.value || null });
  $('#kural-donem-sil').onclick = () => kuralDegis({ sayacBaslangic: null });

  // dosyalar
  $('#f-ders').onchange = async (ev) => {
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    mesaj('Ders programı okunuyor…', 'bilgi');
    try {
      const c = dersProgramiCoz(await pdfOku(f));
      if (!c.ogretmenler.length) throw new Error('PDF’te öğretmen programı bulunamadı. ' + c.uyarilar.join('; '));
      const r = M.programAktar(durum, c);
      kaydet(); iskelet(); veriSayfasi(m);
      mesaj(`<b>${c.ogretmenler.length} öğretmenin programı okundu.</b> Yeni: ${r.eklenen.length} · Güncellenen: ${r.guncellenen.length}${r.guncellenen.length && r.guncellenen.length <= 5 ? ' (' + r.guncellenen.map((x) => e(G(x))).join(', ') + ')' : ''}${c.uyarilar.length ? '<br>Uyarı: ' + c.uyarilar.map(e).join('; ') : ''}`);
    } catch (err) { mesaj('Okunamadı: ' + e(err.message), 'hata'); }
  };
  $('#f-nobet').onchange = async (ev) => {
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    if (nobetVar() && !confirm('Mevcut nöbet düzeni bu çizelgeyle değiştirilecek. Devam edilsin mi?')) return;
    mesaj('Nöbet çizelgesi okunuyor…', 'bilgi');
    try {
      const r = M.nobetAktar(durum, nobetCizelgesiCoz(await pdfOku(f)));
      kaydet(); veriSayfasi(m);
      mesaj(`<b>Nöbet düzeni kuruldu:</b> ${durum.alanlar.length} alan, başlangıç ${M.trTarih(durum.nobet.baslangic)}. Çizelgedeki ${r.hafta} haftanın ${r.uyumlu} günü kaydırma kuralıyla birebir uyuyor${r.uyumsuz.length ? `; <b>uymayan günler: ${r.uyumsuz.map(M.trTarih).join(', ')}</b>` : '.'}
        ${r.eslesmeyen.length ? `<br>Ders programında bulunamayan nöbetçiler (dersi yok sayıldı): ${r.eslesmeyen.map((x) => e(G(x))).join(', ')}` : ''}`, r.uyumsuz.length || r.eslesmeyen.length ? '' : 'basari');
    } catch (err) { mesaj('Okunamadı: ' + e(err.message), 'hata'); }
  };
  $('#nobet-duzen') && ($('#nobet-duzen').onclick = nobetDuzenPenceresi);

  // yedek
  $('#yedek-al').onclick = () => {
    durum.sonYedek = BUGUN(); kaydet();
    const blob = new Blob([JSON.stringify(durum, null, 1)], { type: 'application/json' });
    paylasDosya(blob, `nobetci360-yedek-${BUGUN()}.json`, 'Nöbetçi360 yedeği');
  };
  $('#f-yedek').onchange = async (ev) => {
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    try {
      const v = M.yedekDogrula(JSON.parse(await f.text()));
      if (!confirm(`Yedekte ${v.ogretmenler.length} öğretmen ve ${Object.keys(v.kayitlar).length} günlük kayıt var. Bu cihazdaki veriler yedekle değiştirilsin mi?`)) return;
      durum = v; durum.sonYedek = BUGUN(); kaydet(); iskelet(); veriSayfasi(m); mesaj('Yedek geri yüklendi.');
    } catch (err) { mesaj('Yedek okunamadı: ' + e(err.message), 'hata'); }
  };
  $('#hepsini-sil').onclick = () => {
    if (!confirm('Tüm öğretmenler, nöbet düzeni ve görevlendirme kayıtları silinecek. Emin misin?')) return;
    if (!confirm('Geri alınamaz. Önce yedek almadıysan Vazgeç de. Silinsin mi?')) return;
    durum = M.bosDurum(); kaydet(); iskelet(); veriSayfasi(m);
  };
}

// ---------------- pencere
function pencere(baslik, govde, alt) {
  const d = $('#pencere');
  d.innerHTML = `<div class="pencere-bas"><h2>${baslik}</h2><button class="btn btn-hayalet btn-ikon btn-kucuk" id="p-kapat" title="Kapat">${ikon('kapat')}</button></div>
    <div class="pencere-govde">${govde}</div><div class="pencere-alt">${alt}</div>`;
  $('#p-kapat', d).onclick = () => d.close();
  if (!d.open) d.showModal();
  return d;
}
$('#pencere').addEventListener('click', (ev) => { if (ev.target.id === 'pencere') ev.target.close(); });
$('#pencere').addEventListener('close', () => ciz());

function ogretmenPenceresi(id) {
  const o = M.ogretmen(durum, id);
  const nobetGunleri = Object.entries(durum.nobet.gunler || {}).filter(([, l]) => l.some((x) => x.id === id)).map(([g]) => +g);
  let govde = `<div class="form-satir"><div><label>Ad soyad</label><input class="alan" id="o-ad" value="${e(G(o.ad))}"></div><div><label>Branş</label><input class="alan" id="o-brans" value="${e(G(o.brans))}"></div></div>
    <p class="soluk kucuk-yazi" style="margin:0 0 10px">Her hücreye o saatteki sınıfı yaz (ör. <b>11-A</b>); boş hücre boş saat demektir. ${nobetGunleri.length ? `Nöbet günü: <b>${nobetGunleri.map((g) => M.GUN_ADLARI[g - 1]).join(', ')}</b> (alt çizgili).` : 'Nöbetçi değil.'}</p>
    <div class="tablo-sar"><table class="izgara"><thead><tr><th></th>${KISA_GUN.map((g) => `<th>${g}</th>`).join('')}</tr></thead><tbody>`;
  for (let s = 1; s <= M.SAAT_SAYISI; s++) {
    govde += `<tr><th class="saat-h">${s}. <span class="soluk" style="font-weight:400">${e((durum.saatler[s - 1] || '').split('-')[0])}</span></th>`;
    for (let g = 1; g <= 5; g++) {
      const hc = o.program[`${g}-${s}`] || [];
      govde += `<td class="${nobetGunleri.includes(g) ? 'nob' : ''}"><input data-k="${g}-${s}" placeholder=" " value="${e(hc.map((d) => d.sinif).join(' / '))}" title="${e(hc.map((d) => G(d.ders)).join(' / '))}"></td>`;
    }
    govde += '</tr>';
  }
  govde += '</tbody></table></div>';
  const d = pencere(e(G(o.ad)), govde, `<button class="btn btn-ana" id="o-kaydet">${ikon('tamam')} Kaydet</button><button class="btn" id="o-vazgec">Vazgeç</button><span style="flex:1"></span><button class="btn btn-tehlike" id="o-sil">${ikon('cop')} Sil</button>`);
  $('#o-vazgec', d).onclick = () => d.close();
  $('#o-kaydet', d).onclick = () => {
    o.ad = M.adNorm($('#o-ad', d).value) || o.ad;
    o.brans = $('#o-brans', d).value.trim();
    for (const inp of $$('input[data-k]', d)) {
      const eski = o.program[inp.dataset.k] || [];
      const siniflar = inp.value.split('/').map((x) => x.trim().toUpperCase()).filter(Boolean);
      if (!siniflar.length) delete o.program[inp.dataset.k];
      else if (siniflar.join(' / ') !== eski.map((x) => x.sinif).join(' / ')) o.program[inp.dataset.k] = siniflar.map((sn, i) => ({ ders: eski[i]?.ders || eski[0]?.ders || o.brans || 'Ders', sinif: sn }));
    }
    durum.ogretmenler.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    for (const [t, k] of Object.entries(durum.kayitlar)) if (t >= BUGUN()) M.otomatikAta(durum, t, k);
    kaydet(); d.close(); bildir('Kaydedildi');
  };
  $('#o-sil', d).onclick = () => {
    const kullan = Object.values(durum.kayitlar).some((k) => k.gelmeyenler.some((x) => x.id === id) || k.atamalar.some((a) => a.gorevli === id));
    if (!confirm(`${G(o.ad)} silinsin mi?${kullan ? '\nGeçmiş kayıtlarda adı "?" olarak görünecek.' : ''}${nobetGunleri.length ? '\nNöbet düzeninden de çıkarılacak.' : ''}`)) return;
    durum.ogretmenler = durum.ogretmenler.filter((x) => x.id !== id);
    for (const g of Object.keys(durum.nobet.gunler)) durum.nobet.gunler[g] = durum.nobet.gunler[g].filter((x) => x.id !== id);
    kaydet(); d.close();
  };
}

function nobetDuzenPenceresi() {
  const sec = (s) => `<option value="">— boş —</option>` + durum.ogretmenler.map((o) => `<option value="${o.id}" ${o.id === s ? 'selected' : ''}>${e(G(o.ad))}</option>`).join('');
  let govde = `<p class="soluk kucuk-yazi" style="margin-top:0">Başlangıç haftasında kimin hangi alanda olduğunu belirle; sonraki haftalar buna göre kendiliğinden kayar. Ayrılan öğretmenin yerine yenisini seçmen yeterli.</p>
    <div class="form-satir"><div><label>Başlangıç haftası (Pazartesi)</label><input type="date" class="alan" id="nd-bas" value="${durum.nobet.baslangic}"></div><div></div></div>
    <div class="form-tek"><label>Nöbet alanları (her satıra bir alan)</label><textarea class="alan" id="nd-alanlar" rows="4">${e(durum.alanlar.map(G).join('\n'))}</textarea></div>`;
  for (let g = 1; g <= 5; g++) {
    const l = durum.nobet.gunler[g] || [];
    govde += `<div class="nobet-duzen-gun"><h3>${M.GUN_ADLARI[g - 1]}</h3>${durum.alanlar.map((alan, ai) => {
      const x = l.find((y) => y.alan === ai);
      return `<div class="nd-satir"><span>${e(G(alan))}</span><select class="alan" data-g="${g}" data-a="${ai}">${sec(x?.id)}</select></div>`;
    }).join('')}</div>`;
  }
  const d = pencere('Nöbet düzeni', govde, `<button class="btn btn-ana" id="nd-kaydet">${ikon('tamam')} Kaydet</button><button class="btn" id="nd-vazgec">Vazgeç</button>`);
  $('#nd-vazgec', d).onclick = () => d.close();
  $('#nd-kaydet', d).onclick = () => {
    const alanlar = $('#nd-alanlar', d).value.split('\n').map((x) => x.trim()).filter(Boolean);
    const gunler = {};
    for (let g = 1; g <= 5; g++) gunler[g] = $$(`select[data-g="${g}"]`, d).map((s) => (s.value ? { id: s.value, alan: +s.dataset.a } : null)).filter((x) => x && x.alan < alanlar.length);
    const bas = $('#nd-bas', d).value;
    durum.alanlar = alanlar;
    durum.nobet.gunler = gunler;
    if (bas) durum.nobet.baslangic = M.haftaPazartesi(bas);
    kaydet(); d.close(); bildir('Nöbet düzeni kaydedildi');
  };
}

// ---------------- başlat
if (location.hostname === 'localhost') window.__nobetci = { gorevBelgesi, nobetBelgesi, raporBelgesi, belgeSayfalari, ui };
iskelet();
ciz();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
