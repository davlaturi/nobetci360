// ikon/logo.svg dosyasını js/ikonlar.js'teki tek kaynaktan üretir: node araclar/logo-yaz.mjs
import { writeFileSync } from 'node:fs';
import { logoIsaret } from '../js/ikonlar.js';

const svg = logoIsaret({ boyut: 64 })
  .replace(' class="logo-isaret"', '')
  .replace(' aria-hidden="true"', '');
writeFileSync(new URL('../ikon/logo.svg', import.meta.url), svg);
console.log('ikon/logo.svg yazıldı', svg.length, 'bayt');
