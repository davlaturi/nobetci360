// e-Okul PDF'lerinden müdür yardımcısına gönderilecek hazır yedek dosyasını üretir.
// Kullanım: node araclar/yedek-uret.mjs "<ders programı.pdf>" "<nöbet çizelgesi.pdf>" ["İmza Ad Soyad"]
// Çıktı: kilavuz/nobetci360-yedek.json (öğretmen adı içerir, depoya gitmez)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import * as pdfjs from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs';
import { pdfParcalari, dersProgramiCoz, nobetCizelgesiCoz } from '../js/pdfoku.js';
import * as M from '../js/motor.js';

const [dersYol, nobetYol, imzaAd = ''] = process.argv.slice(2);
if (!dersYol || !nobetYol) { console.error('Kullanım: node araclar/yedek-uret.mjs ders.pdf nobet.pdf ["Ad Soyad"]'); process.exit(1); }
const oku = async (yol) => pdfParcalari(pdfjs, new Uint8Array(readFileSync(yol)));

const d = M.bosDurum();
const dp = dersProgramiCoz(await oku(dersYol));
const r1 = M.programAktar(d, dp);
const r2 = M.nobetAktar(d, nobetCizelgesiCoz(await oku(nobetYol)));
d.imza = { unvan: 'Müdür Yardımcısı', ad: imzaAd };
d.sonYedek = M.tarihStr(new Date());

const kok = new URL('../', import.meta.url);
mkdirSync(new URL('kilavuz/', kok), { recursive: true });
writeFileSync(new URL('kilavuz/nobetci360-yedek.json', kok), JSON.stringify(d, null, 1));

console.log(`Okul: ${d.okul}`);
console.log(`Öğretmen: ${r1.eklenen.length} · Nöbet alanı: ${d.alanlar.length} · Başlangıç haftası: ${M.trTarih(d.nobet.baslangic)}`);
console.log(`Çizelge doğrulama: ${r2.uyumlu} gün uyumlu, uymayan: ${r2.uyumsuz.length}, eşleşmeyen nöbetçi: ${r2.eslesmeyen.length}`);
if (dp.uyarilar.length) console.log('Uyarılar:', dp.uyarilar.join('; '));
console.log(`İmza: ${imzaAd || '(boş — müdür yardımcısı Veriler > Okul bilgileri bölümünden yazar)'}`);
console.log('Yazıldı: kilavuz/nobetci360-yedek.json');
