# Nöbetçi360

Gelmeyen öğretmenlerin derslerine nöbetçi öğretmen görevlendiren ve nöbetçileri her hafta bir sonraki nöbet alanına kaydıran web uygulaması. iPhone'da ve bilgisayarda çalışır; Safari'den "Ana Ekrana Ekle" ile uygulama gibi kurulur, internetsiz de açılır.

## Ne yapar?

- **Görevlendirme:** Gelmeyen öğretmeni ve nedenini (raporlu, mazeretli, görevli, izinli, sevkli) seçersin; boşalan dersler o gün nöbetçi olup o saatte boş olan öğretmenlere adil biçimde dağıtılır. İstenirse elle değiştirilir.
- **Adil dağıtım kuralları:** Sabah/öğleden sonra ayrımı (1–4 / 1–5), esneklik, günlük üst sınır ve sayaç başlangıç tarihi ayarlanabilir.
- **Haftalık nöbet çizelgesi:** Her hafta herkes bir sonraki alana geçer; tatil haftaları kaydırmayı durdurur.
- **Aylık rapor:** Kimin kaç kez görevlendirildiği (sabah/öğle ayrı) ve devamsızlık nedenleri.
- **Paylaşım:** Görevlendirme, nöbet çizelgesi ve rapor; logolu, kurumsal görsel (gerekirse çok sayfalı) olarak WhatsApp'a paylaşılır ya da yazdırılır.

## Veri

- e-Okul'un **Öğretmen Haftalık Ders Programı** PDF'i ve **nöbet çizelgesi** PDF'i uygulama içinde okunur.
- Tüm veriler yalnız kullanılan cihazda (tarayıcı belleğinde) saklanır; hiçbir sunucuya gönderilmez. Cihazlar arası aktarım **Veriler → Yedek** ile yapılır.

## Geliştirme

Derleme adımı yoktur; dosyalar olduğu gibi sunulur.

```bash
python -m http.server 5230
```

- `js/motor.js` — görevlendirme, adalet ve nöbet kaydırma kuralları
- `js/pdfoku.js` — e-Okul PDF okuyucuları (PDF.js)
- `js/resim.js` — paylaşım/yazdırma belgesi (A4 sayfalı görsel)
- `js/ikonlar.js` — logo ve simgeler; `araclar/` simge üretim betikleri

Yazı tipi: IBM Plex Sans (SIL Open Font License, `font/LICENSE-IBM-Plex.txt`). PDF okuma: Mozilla PDF.js (Apache 2.0).
