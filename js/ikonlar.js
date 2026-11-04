// Nöbetçi360 — logo ve arayüz simgeleri (tek kaynak, satır içi SVG)

export const RENK = {
  murekkep: '#0E1A2B',
  kagit: '#F5F3EE',
  vurgu: '#D9482B',
};

// 8 ders saatini temsil eden bölmeli halka; vurgulu dilim haftalık dönüşü gösterir.
function halkaDilimleri(cx, cy, r) {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const a0 = ((-90 + i * 45 + 5) * Math.PI) / 180;
    const a1 = ((-90 + i * 45 + 40) * Math.PI) / 180;
    const p = (a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    out.push({ d: `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`, i, uc: { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1), a: a1 } });
  }
  return out;
}
// Koyu zeminde seçilebilsin diye gri dilimler belirgin; dönüş izi (6, 7) daha açık
const SAYDAMLIK = [1, 0.42, 0.42, 0.42, 0.42, 0.42, 0.62, 0.82];

export function logoIsaret({ boyut = 32, zemin = true, acik = '#F5F3EE', rx = 15 } = {}) {
  const d = halkaDilimleri(32, 32, 20);
  const ok = d[0].uc;
  // dilimin ucunda saat yönünü gösteren küçük ok başı
  const t = ok.a + Math.PI / 2;
  const P = (dx, dy) => `${(ok.x + dx).toFixed(2)},${(ok.y + dy).toFixed(2)}`;
  const u = 4.2;
  const okBasi = `${P(Math.cos(t) * u, Math.sin(t) * u)} ${P(Math.cos(ok.a) * u * 0.9, Math.sin(ok.a) * u * 0.9)} ${P(-Math.cos(ok.a) * u * 0.9, -Math.sin(ok.a) * u * 0.9)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="logo-isaret" width="${boyut}" height="${boyut}" viewBox="0 0 64 64" aria-hidden="true">
    ${zemin ? `<rect width="64" height="64" rx="${rx}" fill="${RENK.murekkep}"/>` : ''}
    ${d.map((s) => `<path d="${s.d}" fill="none" stroke="${s.i === 0 ? RENK.vurgu : acik}" stroke-opacity="${s.i === 0 ? 1 : SAYDAMLIK[s.i]}" stroke-width="5.6" stroke-linecap="butt"/>`).join('')}
    <polygon points="${okBasi}" fill="${RENK.vurgu}"/>
    <g fill="${acik}"><rect x="24" y="23" width="4.4" height="18"/><rect x="35.6" y="23" width="4.4" height="18"/><polygon points="24,23 28.6,23 40,41 35.4,41"/></g>
  </svg>`;
}

export function logoYazi() {
  return `<span class="logo-yazi">Nöbetçi<b>360</b></span>`;
}

const yol = (d) => `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const IKON = {
  gorev: yol('<rect x="4.5" y="4.5" width="15" height="16.5" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11.5h7M8.5 15.5h4.5"/>'),
  nobet: yol('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4.5V9h-4.5"/><path d="M12 8v4l2.5 1.5"/>'),
  rapor: yol('<path d="M3.5 20.5h17"/><path d="M6.5 17V11M12 17V6M17.5 17v-4"/>'),
  veri: yol('<path d="M4 6.5h8.5M16.5 6.5H20M4 12h2.5M10.5 12H20M4 17.5h10.5M18.5 17.5H20"/><circle cx="14.5" cy="6.5" r="2"/><circle cx="8.5" cy="12" r="2"/><circle cx="16.5" cy="17.5" r="2"/>'),
  sol: yol('<path d="M14.5 6l-6 6 6 6"/>'),
  sag: yol('<path d="M9.5 6l6 6-6 6"/>'),
  takvim: yol('<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
  ara: yol('<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20"/>'),
  kapat: yol('<path d="M7 7l10 10M17 7L7 17"/>'),
  paylas: yol('<path d="M12 4v11"/><path d="M8 8l4-4 4 4"/><path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13"/>'),
  metin: yol('<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M8 10h8M8 13h5"/>'),
  yazdir: yol('<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7.5" rx="2"/><path d="M7 14h10v6H7z"/>'),
  yenile: yol('<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9"/><path d="M19.5 4.5V9H15"/><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15"/><path d="M4.5 19.5V15H9"/>'),
  dosya: yol('<path d="M6.5 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M13.5 3.5V8H18"/><path d="M8.5 13h7M8.5 16.5h4.5"/>'),
  indir: yol('<path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M5 19.5h14"/>'),
  yukle: yol('<path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M5 19.5h14"/>'),
  arti: yol('<path d="M12 5v14M5 12h14"/>'),
  uyari: yol('<path d="M12 4.5l8.5 15h-17z"/><path d="M12 10v4.5M12 17v.5"/>'),
  tamam: yol('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  kalem: yol('<path d="M4.5 19.5l1-4.5L15.5 5a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8l-10 10z"/><path d="M13.5 7l3.5 3.5"/>'),
  cop: yol('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9L17.5 7"/>'),
  saat: yol('<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'),
  kalkan: yol('<path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z"/><path d="M9 12l2 2 4-4"/>'),
};
