// Tarayıcı betiklerini Node'da (DOM'suz) yükler: render.js ve ui.js hariç hepsi saftır.
const path = require('path');
for (const f of ['tr', 'data', 'compose', 'lint-tdk', 'validate']) require(path.join(__dirname, '..', 'js', f + '.js'));
module.exports = globalThis.KY;
